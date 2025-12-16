<template>
  <v-container fluid class="plant-detail-page pa-0">
    <!-- Header -->
    <v-app-bar color="transparent" flat class="px-4">
      <v-btn @click="goBack" icon="mdi-arrow-left" variant="text" />
      <v-spacer />
      <v-btn @click="toggleEdit" :icon="isEditing ? 'mdi-check' : 'mdi-pencil'" variant="text" />
      <v-btn @click="showDeleteDialog = true" icon="mdi-delete" variant="text" color="error" />
    </v-app-bar>

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 50vh">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <div v-else-if="plant" class="plant-content">
      <!-- Plant Photo Section -->
      <div class="photo-section mb-6">
        <div class="photo-container" @click="isEditing && selectPhotoSource()">
          <v-img
            v-if="plantForm.photoURL"
            :src="plantForm.photoURL"
            :alt="plantForm.nickname"
            height="300"
            cover
            class="plant-photo"
          >
            <div v-if="isEditing" class="photo-overlay">
              <v-icon size="48" color="white">mdi-camera</v-icon>
              <div class="text-white mt-2">Tap to change photo</div>
            </div>
          </v-img>
          <div v-else class="no-photo-placeholder" :class="{ editable: isEditing }">
            <v-icon size="64" color="grey-lighten-1">mdi-image-plus</v-icon>
            <div class="text-h6 mt-2">{{ isEditing ? 'Add Photo' : 'No Photo' }}</div>
          </div>
        </div>
      </div>

      <!-- Plant Info Section -->
      <v-card class="plant-info-card mb-4" elevation="2">
        <v-card-text class="pa-6">
          <!-- Plant Name -->
          <div class="mb-4">
            <v-text-field
              v-if="isEditing"
              v-model="plantForm.nickname"
              label="Plant Nickname"
              variant="outlined"
              :rules="[rules.required]"
              class="plant-name-input"
            />
            <div v-else>
              <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ plant.nickname }}</h1>
              <div class="text-h6 text-medium-emphasis">{{ plant.plantType }}</div>
            </div>
          </div>

          <!-- Plant Type -->
          <div v-if="isEditing" class="mb-4">
            <v-autocomplete
              v-model="plantForm.plantType"
              :items="plantTypes"
              label="Plant Type"
              variant="outlined"
              :rules="[rules.required]"
            />
          </div>

          <!-- Location -->
          <div class="mb-4">
            <v-text-field
              v-if="isEditing"
              v-model="plantForm.location"
              label="Location"
              variant="outlined"
              prepend-inner-icon="mdi-map-marker"
              :rules="[rules.required]"
            />
            <div v-else class="info-item">
              <v-icon class="mr-3" color="primary">mdi-map-marker</v-icon>
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Location</div>
                <div class="text-body-1">{{ plant.location }}</div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <v-textarea
              v-if="isEditing"
              v-model="plantForm.notes"
              label="Notes"
              variant="outlined"
              rows="3"
              prepend-inner-icon="mdi-note-text"
            />
            <div v-else-if="plant.notes" class="info-item">
              <v-icon class="mr-3" color="primary">mdi-note-text</v-icon>
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Notes</div>
                <div class="text-body-1">{{ plant.notes }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Care Schedule Section -->
      <v-card class="care-schedule-card mb-4" elevation="2">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-calendar-clock</v-icon>
          Care Schedule
        </v-card-title>
        <v-card-text class="pa-6">
          <!-- Watering -->
          <div class="care-item mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-3" color="blue">mdi-water</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Watering</span>
            </div>
            <v-select
              v-if="isEditing"
              v-model="plantForm.wateringFrequency"
              :items="wateringOptions"
              variant="outlined"
              density="compact"
            />
            <div v-else class="ml-9">
              <div class="text-body-1">{{ getWateringText(plant.wateringFrequency) }}</div>
              <div v-if="plant.lastWatered" class="text-caption text-medium-emphasis">
                Last watered: {{ formatDate(plant.lastWatered) }}
              </div>
            </div>
          </div>

          <!-- Light Requirements -->
          <div class="care-item mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-3" color="orange">mdi-weather-sunny</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Light</span>
            </div>
            <v-select
              v-if="isEditing"
              v-model="plantForm.lightRequirement"
              :items="lightOptions"
              variant="outlined"
              density="compact"
            />
            <div v-else class="ml-9">
              <div class="text-body-1">{{ getLightText(plant.lightRequirement) }}</div>
            </div>
          </div>

          <!-- Fertilizer Schedule -->
          <div class="care-item mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-3" color="success">mdi-bottle-tonic</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Fertilizer</span>
            </div>
            <v-select
              v-if="isEditing"
              v-model="plantForm.fertilizerFrequency"
              :items="fertilizerOptions"
              variant="outlined"
              density="compact"
              class="mb-2"
            />
            <v-text-field
              v-if="isEditing && plantForm.fertilizerFrequency === 'custom'"
              v-model="plantForm.customFertilizerWeeks"
              label="Weeks between fertilizing"
              type="number"
              variant="outlined"
              density="compact"
              min="1"
              max="52"
            />
            <div v-else class="ml-9">
              <div class="text-body-1">{{ getFertilizerText(plant.fertilizerFrequency) }}</div>
              <div v-if="plant.lastFertilized" class="text-caption text-medium-emphasis">
                Last fertilized: {{ formatDate(plant.lastFertilized) }}
              </div>
              <div
                v-if="plant.fertilizerFrequency && plant.fertilizerFrequency !== 'never'"
                class="text-caption"
                :class="isFertilizerDue ? 'text-warning' : 'text-success'"
              >
                {{ isFertilizerDue ? '⚠️ Fertilizer due!' : `Next: ${getNextFertilizerDate()}` }}
              </div>
            </div>
          </div>

          <!-- Maintenance Schedule -->
          <div class="care-item">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-3" color="amber">mdi-content-cut</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Maintenance</span>
              <v-chip size="x-small" variant="tonal" color="info" class="ml-2"
                >Pruning, Repotting, Cleaning</v-chip
              >
            </div>
            <v-select
              v-if="isEditing"
              v-model="plantForm.maintenanceFrequency"
              :items="maintenanceOptions"
              variant="outlined"
              density="compact"
              class="mb-2"
            />
            <v-text-field
              v-if="isEditing && plantForm.maintenanceFrequency === 'custom'"
              v-model="plantForm.customMaintenanceWeeks"
              label="Weeks between maintenance"
              type="number"
              variant="outlined"
              density="compact"
              min="1"
              max="52"
            />
            <div v-else class="ml-9">
              <div class="text-body-1">{{ getMaintenanceText(plant.maintenanceFrequency) }}</div>
              <div v-if="plant.lastMaintenance" class="text-caption text-medium-emphasis">
                Last maintenance: {{ formatDate(plant.lastMaintenance) }}
              </div>
              <div
                v-if="plant.maintenanceFrequency && plant.maintenanceFrequency !== 'never'"
                class="text-caption"
                :class="isMaintenanceDue ? 'text-warning' : 'text-success'"
              >
                {{ isMaintenanceDue ? '⚠️ Maintenance due!' : `Next: ${getNextMaintenanceDate()}` }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Plant?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ plant?.nickname }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false" variant="text">Cancel</v-btn>
          <v-btn @click="deletePlant" color="error" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Photo Source Selection -->
    <v-bottom-sheet v-model="showPhotoOptions">
      <v-card>
        <v-card-title>Select Photo Source</v-card-title>
        <v-list>
          <v-list-item @click="openCamera" prepend-icon="mdi-camera">
            <v-list-item-title>Take Photo</v-list-item-title>
          </v-list-item>
          <v-list-item @click="openGallery" prepend-icon="mdi-image">
            <v-list-item-title>Choose from Gallery</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Level Up Dialog -->
    <LevelUpDialog v-model="showLevelUpDialog" :levelUpData="levelUpData" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LevelUpDialog from '@/components/LevelUpDialog.vue'
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
  collection,
  addDoc,
} from 'firebase/firestore'
import {
  handlePlantRemoved,
  handlePlantWatered,
  handleAllPlantsHealthy,
  handlePlantPhotographed,
  handleTaskCompleted,
  checkAndResetDailyTasks,
} from '@/utils/achievements'
import {
  logPlantWatered,
  logAchievementUnlocked,
  logPlantPhotoAdded,
} from '@/services/activityService'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, storage } from '@/firebase'

const route = useRoute()
const router = useRouter()

// Reactive data
const loading = ref(true)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showDeleteDialog = ref(false)
const showPhotoOptions = ref(false)
const fileInput = ref(null)
const user = ref(null)
const plant = ref(null)

// Level up dialog
const showLevelUpDialog = ref(false)
const levelUpData = ref(null)

// Form data
const plantForm = ref({
  nickname: '',
  plantType: '',
  location: '',
  notes: '',
  photoURL: '',
  wateringFrequency: 'weekly',
  lightRequirement: 'bright-indirect',
  fertilizerFrequency: 'monthly',
  customFertilizerWeeks: 4,
  maintenanceFrequency: 'quarterly',
  customMaintenanceWeeks: 12,
})

// Form options
const plantTypes = [
  'Monstera Deliciosa',
  'Snake Plant',
  'Pothos',
  'Peace Lily',
  'Rubber Plant',
  'Fiddle Leaf Fig',
  'ZZ Plant',
  'Spider Plant',
  'Aloe Vera',
  'Succulent',
  'Philodendron',
  'Boston Fern',
  'Bird of Paradise',
  'Croton',
  'Dracaena',
  'English Ivy',
  'Jade Plant',
  'Orchid',
  'Prayer Plant',
  'String of Pearls',
]

const wateringOptions = [
  { title: 'Daily', value: 'daily' },
  { title: 'Alternate Days', value: 'alternate-days' },
  { title: 'Weekly', value: 'weekly' },
  { title: 'Bi-weekly', value: 'biweekly' },
  { title: 'Monthly', value: 'monthly' },
  { title: 'Custom', value: 'custom' },
]

const lightOptions = [
  { title: 'Low Light', value: 'low' },
  { title: 'Bright Indirect', value: 'bright-indirect' },
  { title: 'Bright Direct', value: 'bright-direct' },
  { title: 'Full Sun', value: 'full-sun' },
]

const fertilizerOptions = [
  { title: 'Never', value: 'never' },
  { title: 'Monthly', value: 'monthly' },
  { title: 'Every 2 Months', value: 'bimonthly' },
  { title: 'Quarterly (Every 3 Months)', value: 'quarterly' },
  { title: 'Growing Season Only', value: 'seasonal' },
  { title: 'Custom', value: 'custom' },
]

const maintenanceOptions = [
  { title: 'Never', value: 'never' },
  { title: 'Monthly', value: 'monthly' },
  { title: 'Quarterly (Every 3 Months)', value: 'quarterly' },
  { title: 'Twice a Year', value: 'biannually' },
  { title: 'Annually', value: 'annually' },
  { title: 'Custom', value: 'custom' },
]

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required',
}

// Methods
const goBack = () => {
  if (isEditing.value) {
    cancelEdit()
  } else {
    router.go(-1)
  }
}

const toggleEdit = async () => {
  if (isEditing.value) {
    await savePlant()
  } else {
    startEdit()
  }
}

const startEdit = () => {
  Object.assign(plantForm.value, plant.value)
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  Object.assign(plantForm.value, plant.value)
}

const savePlant = async () => {
  saving.value = true
  try {
    let photoURL = plantForm.value.photoURL

    // Upload photo if there's a new file
    if (plantForm.value._photoFile) {
      // Delete old photo from storage if it exists and is different
      if (
        plant.value?.photoURL &&
        plant.value.photoURL.startsWith('https://firebasestorage.googleapis.com')
      ) {
        try {
          const url = new URL(plant.value.photoURL)
          const pathMatch = url.pathname.match(/o\/(.*?)(?:\?|$)/)
          if (pathMatch) {
            const oldFilePath = decodeURIComponent(pathMatch[1])
            const oldPhotoRef = storageRef(storage, oldFilePath)
            await deleteObject(oldPhotoRef)
          } else {
            console.warn('Could not extract file path from old photo URL in PlantDetailPage')
          }
        } catch (error) {
          console.error('Failed to delete old plant photo in PlantDetailPage:', error)
        }
      } else {
        console.log('No valid old photo to delete or not a Firebase Storage URL in PlantDetailPage')
      }

      // Upload new photo
      const fileName = `users/${user.value.uid}/plants/${Date.now()}`
      const photoRef = storageRef(storage, fileName)
      await uploadBytes(photoRef, plantForm.value._photoFile)
      photoURL = await getDownloadURL(photoRef)
    }

    const plantData = {
      ...plantForm.value,
      photoURL,
      updatedAt: new Date(),
    }
    delete plantData._photoFile

    const plantRef = doc(db, 'plants', route.params.id)
    await updateDoc(plantRef, plantData)

    Object.assign(plant.value, plantData)
    isEditing.value = false
  } catch (error) {
    console.error('Error updating plant:', error)
  } finally {
    saving.value = false
  }
}

const deletePlant = async () => {
  deleting.value = true
  try {
    // Delete plant photo from storage if it exists
    if (plant.value?.photoURL) {
      try {
        // Handle Firebase Storage URLs
        if (plant.value.photoURL.startsWith('https://firebasestorage.googleapis.com')) {
          // Extract file path from Firebase Storage URL
          const url = new URL(plant.value.photoURL)
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

    const plantRef = doc(db, 'plants', route.params.id)
    await deleteDoc(plantRef)
    // Decrement user's plant count
    try {
      const uid = auth.currentUser?.uid
      if (uid) {
        await updateDoc(doc(db, 'users', uid), { numberOfPlants: increment(-1) })
      }
    } catch (err) {
      console.error('Failed to decrement user.numberOfPlants:', err)
    }

    // Update achievements for plant removal
    try {
      const uid = auth.currentUser?.uid
      if (uid) await handlePlantRemoved(uid, route.params.id)
    } catch (err) {
      console.error('Failed to update achievements after plant deletion:', err)
    }

    // Log deletion activity
    try {
      const uid = auth.currentUser?.uid
      if (uid) {
        await addDoc(collection(db, 'users', uid, 'activities'), {
          type: 'plant_deleted',
          title: 'Plant Deleted',
          description: `Deleted ${plant.value?.nickname || ''} from your collection`,
          plantId: route.params.id,
          timestamp: new Date(),
          userId: uid,
          xpEarned: 0,
        })
      }
    } catch (err) {
      console.error('Failed to log plant deletion activity:', err)
    }

    router.push('/app/plants')
  } catch (error) {
    console.error('Error deleting plant:', error)
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
  }
}

const waterPlant = async () => {
  try {
    const plantRef = doc(db, 'plants', route.params.id)
    await updateDoc(plantRef, {
      lastWatered: new Date(),
    })
    plant.value.lastWatered = new Date()

    // Log activity and update achievements
    const uid = auth.currentUser?.uid
    if (uid) {
      // Check and reset daily tasks if needed
      await checkAndResetDailyTasks(uid)

      // Award XP for watering task
      const xpResult = await handleTaskCompleted(uid, 'water', route.params.id)

      // Log the watering activity
      logPlantWatered(uid, { id: route.params.id, ...plant.value }).catch((err) => {
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

      // Log any unlocked achievements
      const allUnlocks = [...(wateringUnlocks || [])]
      if (greenThumbUnlock) allUnlocks.push(greenThumbUnlock)

      for (const unlock of allUnlocks) {
        logAchievementUnlocked(uid, unlock).catch((err) => {
          console.error('Failed to log achievement unlock:', err)
        })
      }

      // Show level up dialog if leveled up
      if (xpResult.levelUp) {
        showLevelUpDialog.value = true
        levelUpData.value = xpResult.levelUp
      }

      // Show XP notification
      if (xpResult.xpEarned > 0) {
        console.log(
          `Watering completed! +${xpResult.xpEarned} XP`,
          xpResult.allThreeCompleted ? '(All tasks bonus!)' : '',
        )
      }
    }
  } catch (error) {
    console.error('Error updating watering:', error)
  }
}

const fertilizePlant = async () => {
  try {
    const plantRef = doc(db, 'plants', plant.value.id)
    await updateDoc(plantRef, {
      lastFertilized: new Date(),
    })

    // Update local state
    plant.value.lastFertilized = new Date()

    // Award XP for fertilizing task
    const uid = auth.currentUser?.uid
    if (uid) {
      await checkAndResetDailyTasks(uid)
      const xpResult = await handleTaskCompleted(uid, 'fertilize', plant.value.id)

      // Show level up dialog if leveled up
      if (xpResult.levelUp) {
        showLevelUpDialog.value = true
        levelUpData.value = xpResult.levelUp
      }

      // Show XP notification
      if (xpResult.xpEarned > 0) {
        console.log(
          `Fertilizing completed! +${xpResult.xpEarned} XP`,
          xpResult.allThreeCompleted ? '(All tasks bonus!)' : '',
        )
      }
    }

    console.log('Plant fertilized successfully')
  } catch (error) {
    console.error('Error fertilizing plant:', error)
  }
}

const maintainPlant = async () => {
  try {
    const plantRef = doc(db, 'plants', plant.value.id)
    await updateDoc(plantRef, {
      lastMaintenance: new Date(),
    })

    // Update local state
    plant.value.lastMaintenance = new Date()

    // Award XP for maintenance task
    const uid = auth.currentUser?.uid
    if (uid) {
      await checkAndResetDailyTasks(uid)
      const xpResult = await handleTaskCompleted(uid, 'maintenance', plant.value.id)

      // Show level up dialog if leveled up
      if (xpResult.levelUp) {
        showLevelUpDialog.value = true
        levelUpData.value = xpResult.levelUp
      }

      // Show XP notification
      if (xpResult.xpEarned > 0) {
        console.log(
          `Maintenance completed! +${xpResult.xpEarned} XP`,
          xpResult.allThreeCompleted ? '(All tasks bonus!)' : '',
        )
      }
    }

    console.log('Plant maintenance completed successfully')
  } catch (error) {
    console.error('Error completing maintenance:', error)
  }
}

// Photo handling
const selectPhotoSource = () => {
  showPhotoOptions.value = true
}

const openCamera = () => {
  showPhotoOptions.value = false
  // Implement camera functionality
}

const openGallery = () => {
  showPhotoOptions.value = false
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    plantForm.value.photoURL = URL.createObjectURL(file)
    plantForm.value._photoFile = file
  }
}

// Helper methods
const getWateringText = (frequency) => {
  const option = wateringOptions.find((opt) => opt.value === frequency)
  return option ? option.title : frequency
}

const getLightText = (requirement) => {
  const option = lightOptions.find((opt) => opt.value === requirement)
  return option ? option.title : requirement
}

const getFertilizerText = (frequency) => {
  if (!frequency) return 'Not set'
  if (frequency === 'custom') {
    const weeks = plant.value?.customFertilizerWeeks
    return weeks ? `Every ${weeks} week${weeks > 1 ? 's' : ''}` : 'Custom'
  }
  const option = fertilizerOptions.find((opt) => opt.value === frequency)
  return option ? option.title : frequency
}

const getMaintenanceText = (frequency) => {
  if (!frequency) return 'Not set'
  if (frequency === 'custom') {
    const weeks = plant.value?.customMaintenanceWeeks
    return weeks ? `Every ${weeks} week${weeks > 1 ? 's' : ''}` : 'Custom'
  }
  const option = maintenanceOptions.find((opt) => opt.value === frequency)
  return option ? option.title : frequency
}

// Get frequency in weeks for calculations
const getFrequencyInWeeks = (frequency, customWeeks, type) => {
  if (frequency === 'custom') return customWeeks || (type === 'fertilizer' ? 4 : 12)

  const frequencyMap = {
    never: null,
    monthly: 4,
    bimonthly: 8,
    quarterly: 13,
    seasonal: 16, // ~4 months (growing season)
    biannually: 26,
    annually: 52,
  }
  return frequencyMap[frequency] || null
}

// Check if fertilizer is due
const isFertilizerDue = computed(() => {
  if (!plant.value?.fertilizerFrequency || plant.value.fertilizerFrequency === 'never') return false

  const weeks = getFrequencyInWeeks(
    plant.value.fertilizerFrequency,
    plant.value.customFertilizerWeeks,
    'fertilizer',
  )
  if (!weeks) return false

  if (!plant.value.lastFertilized) return true // Never fertilized

  const lastDate = plant.value.lastFertilized.toDate
    ? plant.value.lastFertilized.toDate()
    : new Date(plant.value.lastFertilized)
  const daysSince = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince >= weeks * 7
})

// Check if maintenance is due
const isMaintenanceDue = computed(() => {
  if (!plant.value?.maintenanceFrequency || plant.value.maintenanceFrequency === 'never')
    return false

  const weeks = getFrequencyInWeeks(
    plant.value.maintenanceFrequency,
    plant.value.customMaintenanceWeeks,
    'maintenance',
  )
  if (!weeks) return false

  if (!plant.value.lastMaintenance) return true // Never maintained

  const lastDate = plant.value.lastMaintenance.toDate
    ? plant.value.lastMaintenance.toDate()
    : new Date(plant.value.lastMaintenance)
  const daysSince = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince >= weeks * 7
})

// Get next fertilizer date
const getNextFertilizerDate = () => {
  if (!plant.value?.fertilizerFrequency || plant.value.fertilizerFrequency === 'never') return ''

  const weeks = getFrequencyInWeeks(
    plant.value.fertilizerFrequency,
    plant.value.customFertilizerWeeks,
    'fertilizer',
  )
  if (!weeks) return ''

  let nextDate
  if (plant.value.lastFertilized) {
    const lastDate = plant.value.lastFertilized.toDate
      ? plant.value.lastFertilized.toDate()
      : new Date(plant.value.lastFertilized)
    lastDate.setHours(0, 0, 0, 0)
    nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + weeks * 7)
  } else {
    nextDate = new Date() // Due now if never fertilized
  }

  return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Get next maintenance date
const getNextMaintenanceDate = () => {
  if (!plant.value?.maintenanceFrequency || plant.value.maintenanceFrequency === 'never') return ''

  const weeks = getFrequencyInWeeks(
    plant.value.maintenanceFrequency,
    plant.value.customMaintenanceWeeks,
    'maintenance',
  )
  if (!weeks) return ''

  let nextDate
  if (plant.value.lastMaintenance) {
    const lastDate = plant.value.lastMaintenance.toDate
      ? plant.value.lastMaintenance.toDate()
      : new Date(plant.value.lastMaintenance)
    lastDate.setHours(0, 0, 0, 0)
    nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + weeks * 7)
  } else {
    nextDate = new Date() // Due now if never maintained
  }

  return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString()
}

// Load plant data
const loadPlant = async () => {
  try {
    const plantRef = doc(db, 'plants', route.params.id)
    const plantDoc = await getDoc(plantRef)

    if (plantDoc.exists()) {
      plant.value = { id: plantDoc.id, ...plantDoc.data() }
      Object.assign(plantForm.value, plant.value)
    } else {
      router.push('/app/plants')
    }
  } catch (error) {
    console.error('Error loading plant:', error)
    router.push('/app/plants')
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      loadPlant()
    } else {
      router.push('/')
    }
  })
})
</script>

<style scoped>
.plant-detail-page {
  min-height: 100vh;
  padding-bottom: 100px;
  max-width: 800px;
  margin: 0 auto;
}

/* Modern App Bar */
.plant-detail-page :deep(.v-app-bar) {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(10px);
}

.photo-section {
  position: relative;
}

.photo-container {
  position: relative;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.plant-photo {
  border-radius: var(--radius-xl, 16px);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-container:hover .photo-overlay {
  opacity: 1;
}

.no-photo-placeholder {
  height: 300px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: var(--radius-xl, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.04),
    rgba(var(--v-theme-success), 0.04)
  );
}

.no-photo-placeholder.editable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.no-photo-placeholder.editable:hover {
  border-color: rgb(var(--v-theme-primary));
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-success), 0.08)
  );
  transform: scale(1.01);
}

.plant-info-card,
.care-schedule-card {
  border-radius: var(--radius-xl, 16px) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.plant-info-card :deep(.v-card-text) h1 {
  font-family: var(--font-display, 'Manrope', sans-serif);
}

.plant-info-card :deep(.v-card-text .text-h6) {
  font-weight: 500;
}

.care-schedule-card :deep(.v-card-title) {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-weight: 700;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
}

.care-item {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
  padding-left: 16px;
  margin-left: 8px;
  border-radius: 0 var(--radius-md, 8px) var(--radius-md, 8px) 0;
}

.plant-name-input :deep(.v-field) {
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: var(--radius-lg, 12px);
}

.action-buttons {
  padding: 0 16px;
}

/* Quick Actions Styling */
.plant-detail-page :deep(.v-btn) {
  border-radius: var(--radius-lg, 12px);
  font-weight: 600;
}

.plant-content {
  padding: 0 12px;
}

/* Dialog Styling */
.plant-detail-page :deep(.v-dialog .v-card) {
  border-radius: var(--radius-xl, 16px);
}

@media (max-width: 600px) {
  .plant-content {
    padding: 0 8px;
  }

  .photo-container {
    border-radius: var(--radius-lg, 12px);
  }

  .plant-photo {
    border-radius: var(--radius-lg, 12px);
  }
}
</style>
