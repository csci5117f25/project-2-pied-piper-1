<template>
  <v-container fluid class="plants-container">
    <!-- Header with Add Plant Button -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">My Plants</h1>
          <div class="text-body-1 text-medium-emphasis">
            {{ plants.length }} {{ plants.length === 1 ? 'plant' : 'plants' }} in your garden
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          @click="showAddDialog = true"
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          class="hidden-xs"
        >
          Add Plant
        </v-btn>
      </v-col>
    </v-row>

    <!-- Search and Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Search plants..."
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="filterBy"
          :items="filterOptions"
          label="Filter by"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- Plants Grid -->
    <v-row v-if="filteredPlants.length > 0">
      <v-col v-for="plant in filteredPlants" :key="plant.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="plant-card" elevation="2" @click="openPlantDetail(plant)">
          <!-- Plant Image -->
          <div class="plant-image-container">
            <v-img
              v-if="plant.photoURL"
              :src="plant.photoURL"
              :alt="plant.nickname"
              height="200"
              cover
              class="plant-image"
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate color="primary" />
                </div>
              </template>
            </v-img>
            <div v-else class="plant-placeholder d-flex align-center justify-center">
              <v-icon size="64" color="success">mdi-sprout</v-icon>
            </div>

            <!-- Status Badge -->
            <v-chip :color="getPlantStatusColor(plant)" size="small" class="plant-status-chip">
              {{ getPlantStatus(plant) }}
            </v-chip>
          </div>

          <!-- Plant Info -->
          <v-card-text class="pb-2">
            <div class="text-h6 font-weight-medium mb-1 text-truncate">
              {{ plant.nickname }}
            </div>
            <div class="text-body-2 text-medium-emphasis mb-2">
              {{ plant.plantType }}
            </div>

            <!-- Care Info -->
            <div class="d-flex align-center text-body-2 text-medium-emphasis">
              <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
              {{ plant.location }}
            </div>
          </v-card-text>

          <!-- Quick Actions -->
          <v-card-actions class="pt-0">
            <v-btn
              @click.stop="waterPlant(plant)"
              :disabled="!needsWatering(plant)"
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-water"
            >
              Water
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click.stop="editPlant(plant)" icon="mdi-pencil" size="small" variant="text" />
            <v-btn
              @click.stop="deletePlant(plant)"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="plants.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-icon size="120" color="grey-lighten-2" class="mb-6"> mdi-sprout-outline </v-icon>
        <h2 class="text-h5 font-weight-medium mb-4 text-medium-emphasis">No plants yet</h2>
        <p class="text-body-1 text-medium-emphasis mb-6">
          Start your plant journey by adding your first plant!
        </p>
        <v-btn @click="showAddDialog = true" color="primary" size="large" prepend-icon="mdi-plus">
          Add Your First Plant
        </v-btn>
      </v-col>
    </v-row>

    <!-- No Search Results -->
    <v-row v-else>
      <v-col cols="12" class="text-center py-8">
        <v-icon size="80" color="grey-lighten-2" class="mb-4"> mdi-magnify </v-icon>
        <h3 class="text-h6 font-weight-medium mb-2 text-medium-emphasis">No plants found</h3>
        <p class="text-body-2 text-medium-emphasis">Try adjusting your search or filter criteria</p>
      </v-col>
    </v-row>

    <!-- Add Plant Dialog -->
    <AddPlantDialog v-model="showAddDialog" @plant-added="handlePlantAdded" />
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
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import AddPlantDialog from '@/components/AddPlantDialog.vue'

const router = useRouter()

// Reactive data
const plants = ref([])
const searchQuery = ref('')
const filterBy = ref('all')
const showAddDialog = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const showConfirmDialog = ref(false)
const plantToDelete = ref(null)

// Filter options
const filterOptions = [
  { title: 'All Plants', value: 'all' },
  { title: 'Needs Water', value: 'needs-water' },
  { title: 'Recently Watered', value: 'recently-watered' },
  { title: 'Indoor', value: 'indoor' },
  { title: 'Outdoor', value: 'outdoor' },
]

// Computed properties
const filteredPlants = computed(() => {
  let filtered = plants.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (plant) =>
        plant.nickname.toLowerCase().includes(query) ||
        plant.plantType.toLowerCase().includes(query) ||
        plant.location.toLowerCase().includes(query),
    )
  }

  // Apply category filter
  if (filterBy.value && filterBy.value !== 'all') {
    filtered = filtered.filter((plant) => {
      switch (filterBy.value) {
        case 'needs-water':
          return needsWatering(plant)
        case 'recently-watered':
          return !needsWatering(plant)
        case 'indoor':
          return (
            plant.location?.toLowerCase().includes('indoor') ||
            plant.location?.toLowerCase().includes('inside')
          )
        case 'outdoor':
          return (
            plant.location?.toLowerCase().includes('outdoor') ||
            plant.location?.toLowerCase().includes('outside')
          )
        default:
          return true
      }
    })
  }

  return filtered
})

// Plant status functions
const needsWatering = () => {
  // Placeholder logic - will implement proper date checking
  return Math.random() > 0.5
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
    // TODO: Update watering date in Firestore
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastWatered: new Date(),
    })

    showSuccess.value = true
    successMessage.value = `${plant.nickname} watered! 💧`
  } catch (error) {
    console.error('Error watering plant:', error)
  }
}

const editPlant = () => {
  // TODO: Open edit dialog with plant data
  showAddDialog.value = true
}

const deletePlant = (plant) => {
  plantToDelete.value = plant
  showConfirmDialog.value = true
}

const confirmDelete = async () => {
  try {
    if (plantToDelete.value) {
      await deleteDoc(doc(db, 'plants', plantToDelete.value.id))

      showSuccess.value = true
      successMessage.value = `${plantToDelete.value.nickname} deleted`
    }
  } catch (error) {
    console.error('Error deleting plant:', error)
  } finally {
    showConfirmDialog.value = false
    plantToDelete.value = null
  }
}

const handlePlantAdded = (plant) => {
  showSuccess.value = true
  successMessage.value = `${plant.nickname} added successfully!`
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
  padding-top: 16px;
  padding-bottom: 100px; /* Account for bottom navigation */
}

.plant-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px !important;
}

.plant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.plant-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.plant-image {
  border-radius: 12px 12px 0 0;
}

.plant-placeholder {
  height: 200px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%);
}

.plant-status-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

@media (max-width: 600px) {
  .plants-container {
    padding-left: 8px;
    padding-right: 8px;
  }

  .plant-card {
    margin-bottom: 16px;
  }
}
</style>
