<template>
  <v-container fluid class="plants-container">
    <!-- Modern Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <v-icon size="24" color="primary">mdi-leaf</v-icon>
        </div>
        <div>
          <h1 class="page-title">My Plants</h1>
          <p class="page-subtitle">
            {{ plants.length }} {{ plants.length === 1 ? 'plant' : 'plants' }} in your garden
          </p>
        </div>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        size="default"
        @click="showAddDialog = true"
        class="add-plant-btn"
      >
        <span class="add-plant-text">Add Plant</span>
      </v-btn>
    </div>

    <!-- Search -->
    <div class="search-section">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search plants..."
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        class="search-field"
        rounded="lg"
      />
    </div>

    <!-- Plants Grid -->
    <div v-if="filteredPlants.length > 0" class="plants-grid">
      <div v-for="plant in filteredPlants" :key="plant.id" class="plant-card-wrapper">
        <div class="plant-card" @click="openPlantDetail(plant)">
          <!-- Plant Image -->
          <div class="plant-image-container">
            <img
              v-if="plant.photoURL"
              :src="plant.photoURL"
              :alt="plant.nickname"
              class="plant-image"
            />
            <div v-else class="plant-placeholder">
              <span class="placeholder-emoji">🌱</span>
            </div>

            <!-- Status Badge -->
            <div
              :class="['status-badge', needsWatering(plant) ? 'status-warning' : 'status-healthy']"
            >
              {{ getPlantStatus(plant) }}
            </div>
          </div>

          <!-- Plant Info -->
          <div class="plant-info">
            <h3 class="plant-name">{{ plant.nickname }}</h3>
            <p class="plant-type">{{ plant.plantType }}</p>

            <!-- Location -->
            <div class="plant-location">
              <v-icon size="14">mdi-map-marker-outline</v-icon>
              <span>{{ plant.location }}</span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="plant-actions">
            <button
              @click.stop="waterPlant(plant)"
              :disabled="!needsWatering(plant)"
              :class="['action-btn', 'water-btn', { disabled: !needsWatering(plant) }]"
            >
              <v-icon size="16">mdi-water</v-icon>
              <span>Water</span>
            </button>
            <div class="action-icons">
              <button @click.stop="editPlant(plant)" class="icon-btn">
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </button>
              <button @click.stop="deletePlant(plant)" class="icon-btn delete-btn">
                <v-icon size="18">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="plants.length === 0" class="empty-state">
      <div class="empty-icon">🪴</div>
      <h2 class="empty-title">No plants yet</h2>
      <p class="empty-text">Start your plant journey by adding your first plant!</p>
      <v-btn
        @click="showAddDialog = true"
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="add-btn"
      >
        Add Your First Plant
      </v-btn>
    </div>

    <!-- No Search Results -->
    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <h2 class="empty-title">No plants found</h2>
      <p class="empty-text">Try adjusting your search or filter criteria</p>
    </div>

    <!-- Add Plant Dialog -->
    <AddPlantDialog v-model="showAddDialog" @plant-added="handlePlantAdded" />

    <!-- Edit Plant Dialog -->
    <EditPlantDialog
      v-model="showEditDialog"
      :plant="plantToEdit"
      @plant-updated="handlePlantUpdated"
    />
    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" :timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6"> Delete Plant? </v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ plantToDelete?.nickname }}"? This action cannot be
          undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn @click="confirmDelete" color="error">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Achievement Unlock Dialog -->
    <AchievementUnlockDialog
      v-model="showAchievementUnlockDialog"
      :achievement="unlockedAchievementData"
      @update:model-value="
        (val) => {
          if (!val && achievementQueue.length > 0) {
            showNextAchievement()
          }
        }
      "
    />

    <!-- Achievement Toast -->
    <AchievementToast
      v-model="showAchievementToast"
      :achievement="unlockedAchievement"
      @closed="onAchievementToastClosed"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  addDoc,
} from 'firebase/firestore'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import {
  handlePlantRemoved,
  handlePlantWatered,
  handleAllPlantsHealthy,
} from '@/utils/achievements'
import { logPlantWatered, logAchievementUnlocked, logActivity, ACTIVITY_TYPES } from '@/services/activityService'
import { auth, db, storage } from '@/firebase'
import AddPlantDialog from '@/components/AddPlantDialog.vue'
import EditPlantDialog from '@/components/EditPlantDialog.vue'
import AchievementToast from '@/components/AchievementToast.vue'
import AchievementUnlockDialog from '@/components/AchievementUnlockDialog.vue'

const router = useRouter()

// Reactive data
const plants = ref([])
const searchQuery = ref('')
const showAddDialog = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const showConfirmDialog = ref(false)
const plantToDelete = ref(null)
const plantToEdit = ref(null)
const showEditDialog = ref(false)

// Achievement toast and dialog
const showAchievementToast = ref(false)
const unlockedAchievement = ref(null)
const achievementQueue = ref([])
const showAchievementUnlockDialog = ref(false)
const unlockedAchievementData = ref(null)

// Show next achievement in queue
const showNextAchievement = () => {
  if (achievementQueue.value.length > 0) {
    unlockedAchievement.value = achievementQueue.value.shift()
    showAchievementToast.value = true
  }
}

// Queue achievements to show
const queueAchievements = (unlocks) => {
  if (!unlocks || unlocks.length === 0) return
  achievementQueue.value.push(...unlocks)
  if (!showAchievementToast.value) {
    showNextAchievement()
  }
}

// Handle achievement toast closed
const onAchievementToastClosed = () => {
  showNextAchievement()
}

// Computed properties
const filteredPlants = computed(() => {
  let filtered = plants.value

  // Apply search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const searchTerm = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (plant) =>
        (plant.nickname && plant.nickname.toLowerCase().includes(searchTerm)) ||
        (plant.plantType && plant.plantType.toLowerCase().includes(searchTerm)) ||
        (plant.location && plant.location.toLowerCase().includes(searchTerm)),
    )
  }

  return filtered
})

// Plant status functions
const needsWatering = (plant) => {
  if (!plant.lastWatered) {
    // If never watered, it needs water
    return true
  }

  if (!plant.wateringFrequency) {
    // Default to weekly if no frequency set
    return false
  }

  const lastWateredDate = plant.lastWatered.toDate
    ? plant.lastWatered.toDate()
    : new Date(plant.lastWatered)
  const now = new Date()
  const daysSinceWatering = Math.round((now - lastWateredDate) / (1000 * 60 * 60 * 24))

  // Handle different watering frequencies
  if (plant.wateringFrequency === 'daily') {
    return daysSinceWatering >= 1
  } else if (plant.wateringFrequency === 'alternate-days') {
    // Every other day (every 2 days)
    return daysSinceWatering >= 1 && daysSinceWatering % 2 === 0
  } else if (plant.wateringFrequency === 'custom') {
    // Custom frequency - use customWateringDays
    const daysUntilNextWatering = plant.customWateringDays || 7
    return daysSinceWatering >= daysUntilNextWatering
  } else {
    // Weekly, biweekly, monthly
    let daysUntilNextWatering
    switch (plant.wateringFrequency) {
      case 'weekly':
        daysUntilNextWatering = 7
        break
      case 'biweekly':
        daysUntilNextWatering = 14
        break
      case 'monthly':
        daysUntilNextWatering = 30
        break
      default:
        daysUntilNextWatering = 7 // Default to weekly
    }
    return daysSinceWatering >= daysUntilNextWatering
  }
}

const getPlantStatus = (plant) => {
  if (needsWatering(plant)) {
    return 'Needs Water'
  }
  return 'Healthy'
}

const getPlantStatusColor = (plant) => {
  if (needsWatering(plant)) {
    return 'warning'
  }
  return 'success'
}

// Plant actions
const openPlantDetail = (plant) => {
  router.push(`/app/plants/${plant.id}`)
}

const waterPlant = async (plant) => {
  try {
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastWatered: new Date(),
    })

    // Log activity and update achievements
    const uid = auth.currentUser?.uid
    if (uid) {
      // Log the watering activity
      logPlantWatered(uid, plant).catch((err) => {
        console.error('Failed to log watering activity:', err)
      })

      // Update achievements and check for unlocks
      const [wateringUnlocks, greenThumbUnlock] = await Promise.all([
        handlePlantWatered(uid).catch((err) => {
          console.error('Failed to update achievements after watering:', err)
          return []
        }),
        handleAllPlantsHealthy(uid).catch((err) => {
          console.error('Failed to update Green Thumb achievement:', err)
          return null
        }),
      ])

      // Collect all unlocked achievements
      const allUnlocks = [...(wateringUnlocks || [])]
      if (greenThumbUnlock) allUnlocks.push(greenThumbUnlock)

      // Log and show toasts for unlocked achievements
      for (const unlock of allUnlocks) {
        logAchievementUnlocked(uid, unlock).catch((err) => {
          console.error('Failed to log achievement unlock:', err)
        })
      }

      // Queue achievement toasts
      if (allUnlocks.length > 0) {
        queueAchievements(allUnlocks)
      }
    }

    showSuccess.value = true
    successMessage.value = `${plant.nickname} watered! 💧`
  } catch (error) {
    console.error('Error watering plant:', error)
  }
}

const editPlant = (plant) => {
  plantToEdit.value = plant
  showEditDialog.value = true
}

const handlePlantUpdated = (plant) => {
  showSuccess.value = true
  successMessage.value = `${plant.nickname} updated successfully!`
  showEditDialog.value = false
  plantToEdit.value = null
}

const deletePlant = (plant) => {
  plantToDelete.value = plant
  showConfirmDialog.value = true
}

const confirmDelete = async () => {
  if (!plantToDelete.value) return

  const plantToDeleteData = { ...plantToDelete.value }

  // Close dialog immediately for better UX
  showConfirmDialog.value = false
  plantToDelete.value = null

  try {
    // Delete plant photo from storage if it exists
    if (plantToDeleteData.photoURL) {
      try {
        // Handle Firebase Storage URLs
        if (plantToDeleteData.photoURL.startsWith('https://firebasestorage.googleapis.com')) {
          // Extract file path from Firebase Storage URL
          const url = new URL(plantToDeleteData.photoURL)
          const pathMatch = url.pathname.match(/o\/(.*?)(?:\?|$)/)

          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1])
            const photoRef = storageRef(storage, filePath)
            await deleteObject(photoRef)
          }
        }
      } catch (storageError) {
        console.error('Failed to delete plant photo from storage:', storageError)
      }
    }

    // Main deletion operation
    await deleteDoc(doc(db, 'plants', plantToDeleteData.id))

    // Show success message
    showSuccess.value = true
    successMessage.value = `${plantToDeleteData.nickname} deleted`

    // Run background operations (non-blocking)
    const uid = auth.currentUser?.uid
    if (uid) {
      // Update achievements for plant removal (also updates numberOfPlants)
      handlePlantRemoved(uid).catch((err) => {
        console.error('Failed to update achievements after plant deletion:', err)
      })

      // Log deletion activity
      logActivity(uid, ACTIVITY_TYPES.PLANT_DELETED, {
        title: 'Plant Deleted',
        description: `Deleted ${plantToDeleteData.nickname} from your collection`,
        plantId: plantToDeleteData.id,
        plantName: plantToDeleteData.nickname,
        xpEarned: 0,
      }).catch((err) => {
        console.error('Failed to log plant deletion activity:', err)
      })
    }
  } catch (error) {
    console.error('Error deleting plant:', error)
    // Show error message if main deletion fails
    showSuccess.value = true
    successMessage.value = `Failed to delete ${plantToDeleteData.nickname}`
  }
}

const handlePlantAdded = ({ plant, achievements }) => {
  showSuccess.value = true
  successMessage.value = `${plant.nickname} added successfully!`

  // Handle achievement unlocks - only show if truly new
  // The achievements array already contains only newly unlocked achievements
  // from handlePlantAdded in achievements.js, which checks wasFirstUnlocked
  if (achievements && achievements.length > 0) {
    // Show first achievement in dialog
    unlockedAchievementData.value = achievements[0]
    showAchievementUnlockDialog.value = true

    // Queue remaining achievements for toast
    if (achievements.length > 1) {
      achievementQueue.value.push(...achievements.slice(1))
    }
  }
} // Initialize data
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Listen for user's plants
      const plantsQuery = query(collection(db, 'plants'), where('userId', '==', user.uid))

      onSnapshot(plantsQuery, (snapshot) => {
        plants.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      })
    }
  })
})
</script>

<style scoped>
.plants-container {
  padding-top: 20px;
  padding-bottom: 100px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: var(--radius-lg, 12px);
}

.page-title {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.75rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.95);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0 0;
}

.add-plant-btn {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.25);
  transition: all 0.3s ease;
}

.add-plant-btn:hover {
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-2px);
}

.add-btn {
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.3);
}

/* Search Section */
.search-section {
  margin-bottom: 24px;
}

.search-field :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-field :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

/* Plants Grid */
.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Plant Card */
.plant-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.plant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.plant-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

/* Plant Image */
.plant-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.plant-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.plant-card:hover .plant-image {
  transform: scale(1.05);
}

.plant-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-success), 0.08)
  );
}

.placeholder-emoji {
  font-size: 4rem;
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.status-healthy {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.status-warning {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

/* Plant Info */
.plant-info {
  padding: 16px;
}

.plant-name {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.125rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-type {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 12px 0;
}

.plant-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Plant Actions */
.plant-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.water-btn {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.water-btn:hover:not(.disabled) {
  background: rgba(var(--v-theme-primary), 0.2);
}

.water-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-icons {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.5);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 24px;
  opacity: 0.8;
}

.empty-title {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 0 8px 0;
}

.empty-text {
  font-size: 1rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0 0 24px 0;
  max-width: 300px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .add-plant-btn {
    margin-left: auto;
  }

  .plants-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .plants-container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .add-plant-btn {
    width: 100%;
    margin-left: 0;
  }

  .add-plant-text {
    display: inline;
  }

  .header-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .plants-grid {
    grid-template-columns: 1fr;
  }

  .plant-image-container {
    height: 180px;
  }
}
</style>
