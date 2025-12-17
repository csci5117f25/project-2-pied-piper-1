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
                <v-icon size="64" color="primary" class="mb-4"> mdi-camera-plus </v-icon>
                <div class="text-h6 mb-2 font-weight-bold">Add Plant Photo</div>
                <div class="text-body-2 text-medium-emphasis">
                  Tap here to take a photo or choose from gallery
                </div>
              </div>

              <!-- AI Analysis Loading State -->
              <div v-else-if="analyzingPlant" class="photo-analyzing">
                <v-img
                  :src="plantForm.photoURL"
                  :alt="plantForm.nickname || 'Plant photo'"
                  height="200"
                  cover
                  class="rounded elevation-2 mb-4"
                  style="opacity: 0.7"
                />
                <div class="text-center">
                  <v-progress-circular indeterminate color="primary" size="48" class="mb-3" />
                  <div class="text-h6 font-weight-medium">Analyzing your plant...</div>
                  <div class="text-body-2 text-medium-emphasis">
                    AI is identifying the plant type and care needs
                  </div>
                </div>
              </div>

              <div v-else class="photo-preview">
                <v-img
                  :src="plantForm.photoURL"
                  :alt="plantForm.nickname || 'Plant photo'"
                  height="250"
                  cover
                  class="rounded elevation-2"
                />
                <v-btn
                  @click="removePhoto"
                  icon="mdi-close"
                  size="small"
                  color="error"
                  class="photo-remove-btn elevation-2"
                />

                <!-- AI Analysis Result Badge -->
                <v-chip
                  v-if="aiAnalysisResult?.success"
                  class="photo-success-chip"
                  :color="aiConfidenceColor"
                  variant="flat"
                  size="small"
                  :prepend-icon="aiConfidenceIcon"
                >
                  {{ aiAnalysisResult.plantType }} ({{ aiAnalysisResult.confidence }})
                </v-chip>
                <v-chip
                  v-else-if="aiAnalysisResult?.error"
                  class="photo-success-chip"
                  color="warning"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-alert"
                >
                  Manual entry needed
                </v-chip>
                <v-chip
                  v-else
                  class="photo-success-chip"
                  color="success"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-check"
                >
                  Photo Added
                </v-chip>
              </div>
            </div>

            <!-- Photo Source Options -->
            <div class="d-flex gap-3">
              <v-btn
                @click="openCamera"
                variant="outlined"
                prepend-icon="mdi-camera"
                class="flex-1"
                :disabled="analyzingPlant"
              >
                Take Photo
              </v-btn>
              <v-btn
                @click="openGallery"
                variant="outlined"
                prepend-icon="mdi-image"
                class="flex-1"
                :disabled="analyzingPlant"
              >
                Choose Photo
              </v-btn>
            </div>

            <!-- AI Analysis Error Alert -->
            <v-alert
              v-if="aiAnalysisResult?.error"
              type="warning"
              variant="tonal"
              class="mt-4"
              density="compact"
            >
              <div class="text-body-2">
                <strong>AI couldn't identify the plant:</strong> {{ aiAnalysisResult.error }}
              </div>
              <div class="text-caption">You can still add the plant manually.</div>
            </v-alert>
          </div>

          <!-- Step 2: Plant Details -->
          <div v-else-if="currentStep === 2" class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
              Plant Details
              <v-chip
                v-if="aiAnalysisResult?.success"
                color="primary"
                size="small"
                variant="tonal"
                class="ml-2"
                prepend-icon="mdi-robot"
              >
                AI Filled
              </v-chip>
            </h3>

            <v-form ref="plantFormRef" class="plant-details-form">
              <v-text-field
                v-model="plantForm.nickname"
                label="Plant Nickname *"
                placeholder="e.g., Sunny the Succulent"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-4"
                :hint="aiAnalysisResult?.success ? 'Suggested by AI - feel free to change!' : ''"
                persistent-hint
              />

              <v-text-field
                v-model="plantForm.plantType"
                label="Plant Type *"
                placeholder="e.g., Monstera Deliciosa, Snake Plant"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-4"
                :hint="
                  aiAnalysisResult?.success
                    ? `AI identified with ${aiAnalysisResult.confidence} confidence`
                    : ''
                "
                persistent-hint
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
                label="Care Notes"
                :placeholder="
                  aiAnalysisResult?.success ? '' : 'Any special care instructions or notes...'
                "
                variant="outlined"
                rows="3"
                max-rows="5"
                :hint="aiAnalysisResult?.success ? 'AI-generated care tips - edit as needed' : ''"
                persistent-hint
              />
            </v-form>
          </div>

          <!-- Step 3: Care Schedule -->
          <div v-else-if="currentStep === 3" class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
              Care Schedule
              <v-chip
                v-if="aiAnalysisResult?.success"
                color="primary"
                size="small"
                variant="tonal"
                class="ml-2"
                prepend-icon="mdi-robot"
              >
                AI Recommended
              </v-chip>
            </h3>

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
                :hint="aiAnalysisResult?.success ? 'Recommended by AI based on plant type' : ''"
                persistent-hint
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

            <!-- Fertilizer Schedule -->
            <div class="care-section mb-6">
              <h4 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                <v-icon class="mr-2" color="success">mdi-bottle-tonic</v-icon>
                Fertilizer Schedule
              </h4>

              <v-select
                v-model="plantForm.fertilizerFrequency"
                :items="fertilizerOptions"
                label="Fertilizer Frequency"
                variant="outlined"
                class="mb-3"
                hint="How often does this plant need fertilizing?"
                persistent-hint
              />

              <v-text-field
                v-model="plantForm.customFertilizerWeeks"
                v-if="plantForm.fertilizerFrequency === 'custom'"
                label="Weeks between fertilizing"
                type="number"
                variant="outlined"
                min="1"
                max="52"
              />
            </div>

            <!-- Maintenance Schedule -->
            <div class="care-section">
              <h4 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                <v-icon class="mr-2" color="amber">mdi-content-cut</v-icon>
                Maintenance Schedule
                <v-chip size="x-small" variant="tonal" color="info" class="ml-2"
                  >Pruning, Repotting, Cleaning</v-chip
                >
              </h4>

              <v-select
                v-model="plantForm.maintenanceFrequency"
                :items="maintenanceOptions"
                label="Maintenance Frequency"
                variant="outlined"
                class="mb-3"
                hint="Includes pruning, repotting, leaf cleaning, pest checks"
                persistent-hint
              />

              <v-text-field
                v-model="plantForm.customMaintenanceWeeks"
                v-if="plantForm.maintenanceFrequency === 'custom'"
                label="Weeks between maintenance"
                type="number"
                variant="outlined"
                min="1"
                max="52"
              />
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
import { collection, addDoc, doc, updateDoc, increment, getDoc } from 'firebase/firestore'
import { handlePlantAdded, handlePlantPhotographed } from '@/utils/achievements'
import { logAchievementUnlocked, logActivity, ACTIVITY_TYPES } from '@/services/activityService'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, storage } from '@/firebase'
import { analyzePlantImage } from '@/services/geminiService'

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
const plantFormRef = ref(null)

// AI Analysis state
const analyzingPlant = ref(false)
const aiAnalysisResult = ref(null)

// AI confidence indicators
const aiConfidenceColor = computed(() => {
  if (!aiAnalysisResult.value?.success) return 'grey'
  switch (aiAnalysisResult.value.confidence) {
    case 'high':
      return 'success'
    case 'medium':
      return 'warning'
    case 'low':
      return 'error'
    default:
      return 'grey'
  }
})

const aiConfidenceIcon = computed(() => {
  if (!aiAnalysisResult.value?.success) return 'mdi-help'
  switch (aiAnalysisResult.value.confidence) {
    case 'high':
      return 'mdi-check-circle'
    case 'medium':
      return 'mdi-alert-circle'
    case 'low':
      return 'mdi-help-circle'
    default:
      return 'mdi-robot'
  }
})

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
  fertilizerFrequency: 'monthly',
  customFertilizerWeeks: 4,
  maintenanceFrequency: 'quarterly',
  customMaintenanceWeeks: 12,
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
    setTimeout(() => {
      resetForm()
    }, 100)
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
    fertilizerFrequency: 'monthly',
    customFertilizerWeeks: 4,
    maintenanceFrequency: 'quarterly',
    customMaintenanceWeeks: 12,
  }
  // Clear AI analysis state
  aiAnalysisResult.value = null
  analyzingPlant.value = false
}

const nextStep = async () => {
  if (currentStep.value === 2) {
    // Validate form before proceeding to step 3
    if (plantFormRef.value && typeof plantFormRef.value.validate === 'function') {
      const { valid } = await plantFormRef.value.validate()
      if (!valid) return
    }
  }

  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const closeDialog = () => {
  stopCamera()
  resetForm()
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

    // Analyze the plant image with AI
    analyzingPlant.value = true
    aiAnalysisResult.value = null

    try {
      const result = await analyzePlantImage(file)

      if (result) {
        aiAnalysisResult.value = result

        // Auto-fill form fields from AI analysis
        if (result.plantType) {
          plantForm.value.plantType = result.plantType
        }
        if (result.suggestedNickname) {
          plantForm.value.nickname = result.suggestedNickname
        }
        if (result.careNotes) {
          plantForm.value.notes = result.careNotes
        }
        if (result.wateringFrequency) {
          plantForm.value.wateringFrequency = result.wateringFrequency
        }
        if (result.lightRequirement) {
          plantForm.value.lightRequirement = result.lightRequirement
        }
        if (typeof result.needsFertilizer === 'boolean') {
          plantForm.value.needsFertilizer = result.needsFertilizer
        }
        if (typeof result.needsPruning === 'boolean') {
          plantForm.value.needsPruning = result.needsPruning
        }

        console.log('AI Analysis completed:', result)
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      // Continue without AI - user can still fill manually
    } finally {
      analyzingPlant.value = false
    }
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
  // Clear AI analysis when photo is removed
  aiAnalysisResult.value = null
  analyzingPlant.value = false
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
      const fileName = `users/${user.value.uid}/plants/${Date.now()}`
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
      lastFertilized: null,
      lastMaintenance: null,
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

      // Log activity (non-critical, don't fail if this fails)
      try {
        await logActivity(user.value.uid, ACTIVITY_TYPES.PLANT_ADDED, {
          title: 'Added New Plant',
          description: `Welcome ${plantData.nickname} to your collection!`,
          plantId: docRef.id,
          plantName: plantData.nickname,
          xpEarned: 10,
        })
      } catch (err) {
        console.error('Failed to log activity:', err)
      }

      // Update achievements for this user - pass the NEW count (current + 1)
      // Note: handlePlantAdded will also update the user.numberOfPlants field based on actual count
      let allUnlocks = []
      try {
        const plantUnlocks = await handlePlantAdded(user.value.uid)

        // If plant has a photo, also check photo achievement
        let photoUnlock = null
        if (plantData.photoURL) {
          photoUnlock = await handlePlantPhotographed(user.value.uid)
        }

        // Log any unlocked achievements
        allUnlocks = [...(plantUnlocks || [])]
        if (photoUnlock) allUnlocks.push(photoUnlock)

        for (const unlock of allUnlocks) {
          logAchievementUnlocked(user.value.uid, unlock).catch((err) => {
            console.error('Failed to log achievement unlock:', err)
          })
        }
      } catch (err) {
        console.error('Failed to update achievements after adding plant:', err)
      }

      emit('plant-added', { plant: { id: docRef.id, ...plantData }, achievements: allUnlocks })
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
  border-radius: var(--radius-xl, 16px) !important;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Add gradient accent bar */
.add-plant-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-success)));
  z-index: 10;
}

.add-plant-dialog :deep(.v-card-title) {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-weight: 700;
  padding-top: 24px !important;
}

.plant-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}

.step-header {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.photo-upload-container {
  min-height: 250px;
}

.photo-upload-area {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: var(--radius-xl, 16px);
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
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

.photo-upload-area:hover {
  border-color: rgb(var(--v-theme-primary));
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-success), 0.08)
  );
  transform: translateY(-2px);
}

.photo-preview {
  position: relative;
  display: inline-block;
  width: 100%;
}

.photo-preview :deep(.v-img) {
  border-radius: var(--radius-xl, 16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.photo-remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.photo-success-chip {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.plant-details-form .v-field {
  border-radius: var(--radius-lg, 12px);
}

.care-section {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
  padding-left: 16px;
  margin-left: 4px;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

/* AI Analysis Styles */
.photo-analyzing {
  position: relative;
}

.photo-analyzing::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-success), 0.1) 50%,
    rgba(var(--v-theme-primary), 0.1) 100%
  );
  animation: ai-pulse 2s ease-in-out infinite;
  border-radius: var(--radius-xl, 16px);
  pointer-events: none;
}

@keyframes ai-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* Card Actions */
.add-plant-dialog :deep(.v-card-actions) {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

@media (max-width: 600px) {
  .add-plant-dialog {
    margin: 0;
    height: 100%;
    max-height: 100vh;
    border-radius: 0 !important;
  }

  .add-plant-dialog::before {
    display: none;
  }
}
</style>
