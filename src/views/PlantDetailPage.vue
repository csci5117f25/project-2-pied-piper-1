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
          <div v-else class="no-photo-placeholder" :class="{ 'editable': isEditing }">
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

          <!-- Additional Care -->
          <div class="care-item">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-3" color="green">mdi-leaf</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Additional Care</span>
            </div>
            <div v-if="isEditing" class="ml-9">
              <v-switch
                v-model="plantForm.needsFertilizer"
                label="Needs Fertilizer"
                color="primary"
                density="compact"
                hide-details
                class="mb-2"
              />
              <v-switch
                v-model="plantForm.needsPruning"
                label="Needs Pruning"
                color="primary"
                density="compact"
                hide-details
              />
            </div>
            <div v-else class="ml-9">
              <v-chip
                v-if="plant.needsFertilizer"
                size="small"
                color="success"
                variant="tonal"
                class="mr-2 mb-1"
              >
                <v-icon start>mdi-nutrition</v-icon>
                Fertilizer
              </v-chip>
              <v-chip
                v-if="plant.needsPruning"
                size="small"
                color="warning"
                variant="tonal"
                class="mr-2 mb-1"
              >
                <v-icon start>mdi-content-cut</v-icon>
                Pruning
              </v-chip>
              <div v-if="!plant.needsFertilizer && !plant.needsPruning" class="text-body-2 text-medium-emphasis">
                No additional care needed
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Action Buttons -->
      <div v-if="!isEditing" class="action-buttons mb-6">
        <v-btn
          @click="waterPlant"
          color="primary"
          size="large"
          block
          prepend-icon="mdi-water"
          class="mb-3"
        >
          Water Plant
        </v-btn>
        <v-row>
          <v-col cols="6">
            <v-btn
              @click="fertilizePlant"
              color="success"
              variant="outlined"
              block
              prepend-icon="mdi-nutrition"
            >
              Fertilize
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              @click="prunePlant"
              color="warning"
              variant="outlined"
              block
              prepend-icon="mdi-content-cut"
            >
              Prune
            </v-btn>
          </v-col>
        </v-row>
      </div>
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
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, updateDoc, deleteDoc, increment, collection, addDoc } from 'firebase/firestore'
import { handlePlantRemoved } from '@/utils/achievements'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
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

// Form data
const plantForm = ref({
  nickname: '',
  plantType: '',
  location: '',
  notes: '',
  photoURL: '',
  wateringFrequency: 'weekly',
  lightRequirement: 'bright-indirect',
  needsFertilizer: false,
  needsPruning: false,
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
  { title: 'Every 2-3 days', value: 'frequent' },
  { title: 'Weekly', value: 'weekly' },
  { title: 'Bi-weekly', value: 'biweekly' },
  { title: 'Monthly', value: 'monthly' },
]

const lightOptions = [
  { title: 'Low Light', value: 'low' },
  { title: 'Bright Indirect', value: 'bright-indirect' },
  { title: 'Bright Direct', value: 'bright-direct' },
  { title: 'Full Sun', value: 'full-sun' },
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
      const fileName = `plants/${user.value.uid}/${Date.now()}`
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
  } catch (error) {
    console.error('Error updating watering:', error)
  }
}

const fertilizePlant = () => {
  // Implement fertilize logic
  console.log('Fertilizing plant...')
}

const prunePlant = () => {
  // Implement pruning logic
  console.log('Pruning plant...')
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
  const option = wateringOptions.find(opt => opt.value === frequency)
  return option ? option.title : frequency
}

const getLightText = (requirement) => {
  const option = lightOptions.find(opt => opt.value === requirement)
  return option ? option.title : requirement
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

.photo-section {
  position: relative;
}

.photo-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}

.plant-photo {
  border-radius: 16px;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-container:hover .photo-overlay {
  opacity: 1;
}

.no-photo-placeholder {
  height: 300px;
  border: 2px dashed #e0e0e0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.no-photo-placeholder.editable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.no-photo-placeholder.editable:hover {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.plant-info-card,
.care-schedule-card {
  border-radius: 16px !important;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}

.care-item {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.2);
  padding-left: 16px;
  margin-left: 8px;
}

.plant-name-input :deep(.v-field) {
  font-size: 1.5rem;
  font-weight: bold;
}

.action-buttons {
  padding: 0 16px;
}

.plant-content {
  padding: 0 12px;
}

@media (max-width: 600px) {
  .plant-content {
    padding: 0 8px;
  }
}
</style>