<template>
  <v-dialog v-model="internalDialog" max-width="600" persistent scrollable>
    <v-card class="add-plant-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-3" color="primary">mdi-sprout</v-icon>
        {{ isEditing ? 'Edit Plant' : 'Add New Plant' }}
        <v-spacer />
        <v-btn @click="closeDialog" icon="mdi-close" variant="text" size="small" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <!-- Step Content -->
        <div class="stepper-content">
          <!-- Step Header -->
          <div class="step-header pa-4">
            <v-breadcrumbs :items="stepBreadcrumbs" density="compact">
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item :disabled="item.disabled" @click="currentStep = item.value">
                  {{ item.title }}
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </div>

          <!-- Step 1: Plant Photo -->
          <div v-if="currentStep === 1" class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Add a Photo</h3>

            <!-- Photo Upload Area -->
            <div class="photo-upload-container mb-4">
              <div v-if="!plantForm.photoURL" class="photo-upload-area" @click="selectPhotoSource">
                <v-icon size="64" color="grey-lighten-1" class="mb-4"> mdi-camera-plus </v-icon>
                <div class="text-h6 mb-2">Add Plant Photo</div>
                <div class="text-body-2 text-medium-emphasis">
                  Tap to take a photo or choose from gallery
                </div>
              </div>

              <div v-else class="photo-preview">
                <v-img
                  :src="plantForm.photoURL"
                  :alt="plantForm.nickname"
                  height="200"
                  cover
                  class="rounded"
                />
                <v-btn
                  @click="removePhoto"
                  icon="mdi-close"
                  size="small"
                  color="error"
                  class="photo-remove-btn"
                />
              </div>
            </div>

            <!-- Photo Source Options -->
            <div class="d-flex gap-3">
              <v-btn
                @click="openCamera"
                variant="outlined"
                prepend-icon="mdi-camera"
                class="flex-1"
              >
                Take Photo
              </v-btn>
              <v-btn
                @click="openGallery"
                variant="outlined"
                prepend-icon="mdi-image"
                class="flex-1"
              >
                Choose Photo
              </v-btn>
            </div>
          </div>

          <!-- Step 2: Plant Details -->
          <div v-else-if="currentStep === 2" class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Plant Details</h3>

            <v-form ref="plantForm" class="plant-details-form">
              <v-text-field
                v-model="plantForm.nickname"
                label="Plant Nickname *"
                placeholder="e.g., Sunny the Succulent"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-4"
              />

              <v-autocomplete
                v-model="plantForm.plantType"
                :items="plantTypes"
                label="Plant Type *"
                placeholder="Start typing to search..."
                variant="outlined"
                :rules="[rules.required]"
                clearable
                class="mb-4"
              />

              <v-text-field
                v-model="plantForm.location"
                label="Location *"
                placeholder="e.g., Living Room, Balcony, Kitchen"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-4"
              />

              <v-textarea
                v-model="plantForm.notes"
                label="Notes (Optional)"
                placeholder="Any special care instructions or notes..."
                variant="outlined"
                rows="3"
                max-rows="5"
              />
            </v-form>
          </div>

          <!-- Step 3: Care Schedule -->
          <div v-else-if="currentStep === 3" class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Care Schedule</h3>

            <!-- Watering Schedule -->
            <div class="care-section mb-6">
              <h4 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-water</v-icon>
                Watering Schedule
              </h4>

              <v-select
                v-model="plantForm.wateringFrequency"
                :items="wateringOptions"
                label="Watering Frequency"
                variant="outlined"
                class="mb-3"
              />

              <v-text-field
                v-model="plantForm.customWateringDays"
                v-if="plantForm.wateringFrequency === 'custom'"
                label="Days between watering"
                type="number"
                variant="outlined"
                min="1"
                max="365"
              />
            </div>

            <!-- Light Requirements -->
            <div class="care-section mb-6">
              <h4 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                <v-icon class="mr-2" color="warning">mdi-weather-sunny</v-icon>
                Light Requirements
              </h4>

              <v-select
                v-model="plantForm.lightRequirement"
                :items="lightOptions"
                label="Light Needs"
                variant="outlined"
              />
            </div>

            <!-- Additional Care -->
            <div class="care-section">
              <h4 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                <v-icon class="mr-2" color="success">mdi-leaf</v-icon>
                Additional Care
              </h4>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="plantForm.needsFertilizer"
                    label="Needs Fertilizer"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="plantForm.needsPruning"
                    label="Needs Pruning"
                    color="primary"
                    hide-details
                  />
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-btn
          v-if="currentStep > 1"
          @click="currentStep--"
          variant="text"
          prepend-icon="mdi-chevron-left"
        >
          Back
        </v-btn>

        <v-spacer />

        <v-btn @click="closeDialog" variant="text"> Cancel </v-btn>

        <v-btn
          v-if="currentStep < 3"
          @click="nextStep"
          color="primary"
          prepend-icon="mdi-chevron-right"
        >
          Next
        </v-btn>

        <v-btn v-else @click="savePlant" :loading="saving" color="primary" prepend-icon="mdi-check">
          {{ isEditing ? 'Update Plant' : 'Add Plant' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Camera Capture Dialog -->
    <v-dialog v-model="showCamera" fullscreen>
      <v-card>
        <v-app-bar color="black" density="compact">
          <v-app-bar-title>Take Photo</v-app-bar-title>
          <v-spacer />
          <v-btn @click="showCamera = false" icon="mdi-close" />
        </v-app-bar>

        <div class="camera-container">
          <video ref="videoElement" class="camera-preview" autoplay playsinline />

          <canvas ref="canvasElement" style="display: none" />

          <!-- Camera Controls -->
          <div class="camera-controls">
            <v-btn @click="capturePhoto" icon size="x-large" color="white" class="capture-button">
              <v-icon size="32">mdi-camera</v-icon>
            </v-btn>
          </div>
        </div>
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
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, storage } from '@/firebase'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  plant: {
    type: Object,
    default: null,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'plant-added', 'plant-updated'])

// Reactive data
const currentStep = ref(1)
const saving = ref(false)
const showCamera = ref(false)
const showPhotoOptions = ref(false)
const videoElement = ref(null)
const canvasElement = ref(null)
const fileInput = ref(null)
const cameraStream = ref(null)
const user = ref(null)

// Dialog control
const internalDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.plant)

// Form data
const plantForm = ref({
  nickname: '',
  plantType: '',
  location: '',
  notes: '',
  photoURL: '',
  wateringFrequency: 'weekly',
  customWateringDays: 7,
  lightRequirement: 'bright-indirect',
  needsFertilizer: false,
  needsPruning: false,
})

// Stepper breadcrumbs
const stepBreadcrumbs = computed(() => [
  { title: 'Photo', value: 1, disabled: false },
  { title: 'Details', value: 2, disabled: currentStep.value < 2 },
  { title: 'Care Schedule', value: 3, disabled: currentStep.value < 3 },
])

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
  { title: 'Custom', value: 'custom' },
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

// Watch for plant prop changes (editing mode)
watch(
  () => props.plant,
  (newPlant) => {
    if (newPlant) {
      Object.assign(plantForm.value, newPlant)
    }
  },
  { immediate: true },
)

// Reset form when dialog closes
watch(internalDialog, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

// Methods
const resetForm = () => {
  currentStep.value = 1
  plantForm.value = {
    nickname: '',
    plantType: '',
    location: '',
    notes: '',
    photoURL: '',
    wateringFrequency: 'weekly',
    customWateringDays: 7,
    lightRequirement: 'bright-indirect',
    needsFertilizer: false,
    needsPruning: false,
  }
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const closeDialog = () => {
  stopCamera()
  internalDialog.value = false
}

// Photo handling
const selectPhotoSource = () => {
  showPhotoOptions.value = true
}

const openCamera = async () => {
  showPhotoOptions.value = false

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })

    cameraStream.value = stream
    showCamera.value = true

    // Wait for dialog to open
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (videoElement.value) {
      videoElement.value.srcObject = stream
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('Unable to access camera. Please check permissions.')
  }
}

const openGallery = () => {
  showPhotoOptions.value = false
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processPhotoFile(file)
  }
}

const capturePhoto = () => {
  if (videoElement.value && canvasElement.value) {
    const video = videoElement.value
    const canvas = canvasElement.value
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          processPhotoFile(blob)
        }
      },
      'image/jpeg',
      0.8,
    )
  }

  stopCamera()
  showCamera.value = false
}

const processPhotoFile = async (file) => {
  try {
    // Create object URL for preview
    plantForm.value.photoURL = URL.createObjectURL(file)

    // Store file for later upload
    plantForm.value._photoFile = file
  } catch (error) {
    console.error('Error processing photo:', error)
  }
}

const removePhoto = () => {
  if (plantForm.value.photoURL && plantForm.value.photoURL.startsWith('blob:')) {
    URL.revokeObjectURL(plantForm.value.photoURL)
  }
  plantForm.value.photoURL = ''
  plantForm.value._photoFile = null
}

const stopCamera = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop())
    cameraStream.value = null
  }
}

// Save plant
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

    // Prepare plant data
    const plantData = {
      ...plantForm.value,
      photoURL,
      userId: user.value.uid,
      createdAt: new Date(),
      lastWatered: null,
    }

    // Remove internal file reference
    delete plantData._photoFile

    if (isEditing.value) {
      // Update existing plant
      const plantRef = doc(db, 'plants', props.plant.id)
      await updateDoc(plantRef, {
        ...plantData,
        updatedAt: new Date(),
      })

      emit('plant-updated', { id: props.plant.id, ...plantData })
    } else {
      // Add new plant
      const docRef = await addDoc(collection(db, 'plants'), plantData)

      emit('plant-added', { id: docRef.id, ...plantData })
    }

    closeDialog()
  } catch (error) {
    console.error('Error saving plant:', error)
    alert('Failed to save plant. Please try again.')
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.add-plant-dialog {
  border-radius: 12px !important;
}

.plant-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}

.photo-upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.photo-upload-area:hover {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}

.photo-preview {
  position: relative;
  display: inline-block;
}

.photo-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.plant-details-form .v-field {
  border-radius: 8px;
}

.care-section {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
  padding-left: 16px;
}

.flex-1 {
  flex: 1;
}

.gap-3 {
  gap: 12px;
}

/* Camera Styles */
.camera-container {
  position: relative;
  height: 100%;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.camera-controls {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
}

.capture-button {
  border: 4px solid white !important;
}

@media (max-width: 600px) {
  .add-plant-dialog {
    margin: 0;
    height: 100%;
    max-height: 100vh;
    border-radius: 0 !important;
  }
}
</style>
