<template>
  <v-dialog v-model="internalDialog" max-width="600" persistent scrollable>
    <v-card class="edit-plant-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-3" color="primary">mdi-sprout</v-icon>
        Edit Plant
        <v-spacer />
        <v-btn @click="closeDialog" icon="mdi-close" variant="text" size="small" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Photo Section -->
        <div class="photo-section mb-6">
          <h3 class="text-h6 mb-3">Plant Photo</h3>
          <div class="photo-container">
            <div v-if="form.photoURL" class="photo-preview">
              <v-img
                :src="form.photoURL"
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
            <div v-else class="photo-upload-area" @click="selectPhoto">
              <v-icon size="48" color="grey">mdi-camera-plus</v-icon>
              <div class="text-body-2 mt-2">Add Photo</div>
            </div>
          </div>
          <v-btn
            v-if="form.photoURL"
            @click="selectPhoto"
            variant="outlined"
            size="small"
            class="mt-2"
          >
            Change Photo
          </v-btn>
        </div>

        <v-form ref="formRef">
          <v-text-field
            v-model="form.nickname"
            label="Plant Nickname *"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-4"
          />

          <v-autocomplete
            v-model="form.plantType"
            :items="plantTypes"
            label="Plant Type *"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-4"
          />

          <v-text-field
            v-model="form.location"
            label="Location *"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-4"
          />

          <v-textarea
            v-model="form.notes"
            label="Notes (Optional)"
            variant="outlined"
            rows="3"
            class="mb-4"
          />

          <v-select
            v-model="form.wateringFrequency"
            :items="wateringOptions"
            label="Watering Frequency"
            variant="outlined"
            class="mb-4"
          />

          <v-text-field
            v-model="form.customWateringDays"
            v-if="form.wateringFrequency === 'custom'"
            label="Days between watering"
            type="number"
            variant="outlined"
            min="1"
            max="365"
            class="mb-4"
          />

          <v-select
            v-model="form.lightRequirement"
            :items="lightOptions"
            label="Light Requirements"
            variant="outlined"
            class="mb-4"
          />

          <v-row>
            <v-col cols="6">
              <v-switch
                v-model="form.needsFertilizer"
                label="Needs Fertilizer"
                color="primary"
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="form.needsPruning"
                label="Needs Pruning"
                color="primary"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn @click="closeDialog" variant="text">Cancel</v-btn>
        <v-btn @click="updatePlant" :loading="saving" color="primary">
          Update Plant
        </v-btn>
      </v-card-actions>
    </v-card>

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
import { ref, computed, watch } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'

const props = defineProps({
  modelValue: Boolean,
  plant: Object
})

const emit = defineEmits(['update:modelValue', 'plant-updated'])

const saving = ref(false)
const formRef = ref(null)
const fileInput = ref(null)

const internalDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
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
  _photoFile: null
})

const plantTypes = [
  'Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Peace Lily', 'Rubber Plant',
  'Fiddle Leaf Fig', 'ZZ Plant', 'Spider Plant', 'Aloe Vera', 'Succulent'
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
  { title: 'Full Sun', value: 'full-sun' }
]

const rules = {
  required: value => !!value || 'This field is required'
}

// Load plant data when dialog opens
watch(() => props.plant, (plant) => {
  if (plant) {
    form.value = {
      nickname: plant.nickname || '',
      plantType: plant.plantType || '',
      location: plant.location || '',
      notes: plant.notes || '',
      photoURL: plant.photoURL || '',
      wateringFrequency: plant.wateringFrequency || 'weekly',
      customWateringDays: plant.customWateringDays || 7,
      lightRequirement: plant.lightRequirement || 'bright-indirect',
      needsFertilizer: plant.needsFertilizer || false,
      needsPruning: plant.needsPruning || false,
      _photoFile: null
    }
  }
}, { immediate: true })

// Photo handling
const selectPhoto = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.photoURL = URL.createObjectURL(file)
    form.value._photoFile = file
  }
}

const removePhoto = () => {
  if (form.value.photoURL && form.value.photoURL.startsWith('blob:')) {
    URL.revokeObjectURL(form.value.photoURL)
  }
  form.value.photoURL = ''
  form.value._photoFile = null
}

const updatePlant = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    let photoURL = form.value.photoURL

    // Upload new photo if selected
    if (form.value._photoFile) {
      console.log('New photo file detected, checking for old photo to delete')
      console.log('Old photo URL:', props.plant.photoURL)
      
      // Delete old photo from storage if it exists and is different
      if (props.plant.photoURL && props.plant.photoURL.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          console.log('Attempting to delete old photo from storage')
          const url = new URL(props.plant.photoURL)
          const pathMatch = url.pathname.match(/o\/(.*?)(?:\?|$)/)
          if (pathMatch) {
            const oldFilePath = decodeURIComponent(pathMatch[1])
            console.log('Extracted old file path:', oldFilePath)
            const oldPhotoRef = storageRef(storage, oldFilePath)
            await deleteObject(oldPhotoRef)
            console.log('Successfully deleted old photo from storage')
          } else {
            console.warn('Could not extract file path from old photo URL')
          }
        } catch (error) {
          console.error('Failed to delete old plant photo:', error)
        }
      } else {
        console.log('No valid old photo to delete or not a Firebase Storage URL')
      }

      // Upload new photo
      const fileName = `users/${props.plant.userId}/plants/${Date.now()}`
      const photoRef = storageRef(storage, fileName)
      await uploadBytes(photoRef, form.value._photoFile)
      photoURL = await getDownloadURL(photoRef)
    }

    const updateData = {
      nickname: form.value.nickname,
      plantType: form.value.plantType,
      location: form.value.location,
      notes: form.value.notes,
      photoURL,
      wateringFrequency: form.value.wateringFrequency,
      customWateringDays: form.value.customWateringDays,
      lightRequirement: form.value.lightRequirement,
      needsFertilizer: form.value.needsFertilizer,
      needsPruning: form.value.needsPruning,
      updatedAt: new Date()
    }

    const plantRef = doc(db, 'plants', props.plant.id)
    await updateDoc(plantRef, updateData)

    emit('plant-updated', { id: props.plant.id, ...updateData })
    closeDialog()
  } catch (error) {
    console.error('Error updating plant:', error)
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  internalDialog.value = false
}
</script>

<style scoped>
.edit-plant-dialog {
  border-radius: 12px !important;
}

.photo-container {
  display: flex;
  justify-content: center;
}

.photo-preview {
  position: relative;
  display: inline-block;
  width: 200px;
}

.photo-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.photo-upload-area {
  width: 200px;
  height: 200px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.photo-upload-area:hover {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}
</style>