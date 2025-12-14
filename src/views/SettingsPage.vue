<template>
  <v-container fluid class="settings-container">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">Settings</h1>
        <p class="text-body-1 text-medium-emphasis">Manage your account and app preferences</p>
      </v-col>
    </v-row>

    <!-- User Profile Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-account</v-icon>
            Profile
          </v-card-title>

          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-6">
              <!-- Profile Picture -->
              <v-avatar size="80" class="mr-4">
                <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" />
                <v-icon v-else size="48">mdi-account-circle</v-icon>
              </v-avatar>

              <!-- User Info -->
              <div class="flex-grow-1">
                <h3 class="text-h6 font-weight-bold mb-1">
                  {{ user?.displayName || 'Plant Lover' }}
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-2">
                  {{ user?.email }}
                </p>
                <v-chip size="small" color="success">
                  Member since {{ formatDate(user?.metadata?.creationTime) }}
                </v-chip>
              </div>

              <!-- Edit Button -->
              <v-btn @click="showEditProfile = true" variant="outlined" prepend-icon="mdi-pencil">
                Edit Profile
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- App Settings -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            App Preferences
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list>
              <!-- Notifications -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-bell</v-icon>
                </template>

                <v-list-item-title>Push Notifications</v-list-item-title>
                <v-list-item-subtitle>
                  Get reminders for watering and care tasks
                </v-list-item-subtitle>

                <template #append>
                  <v-switch
                    v-model="settings.notifications"
                    @update:model-value="updateNotificationSettings"
                    color="primary"
                    hide-details
                  />
                </template>
              </v-list-item>

              <!-- Notification Detail Settings (shown when enabled) -->
              <template v-if="settings.notifications">
                <v-list-item class="pl-12">
                  <v-list-item-title class="text-body-2">Watering Reminders 💧</v-list-item-title>
                  <template #append>
                    <v-switch
                      v-model="notificationDetails.watering"
                      @update:model-value="saveNotificationDetails"
                      color="primary"
                      hide-details
                      density="compact"
                    />
                  </template>
                </v-list-item>

                <v-list-item class="pl-12">
                  <v-list-item-title class="text-body-2">Fertilizer Reminders 🌱</v-list-item-title>
                  <template #append>
                    <v-switch
                      v-model="notificationDetails.fertilizer"
                      @update:model-value="saveNotificationDetails"
                      color="primary"
                      hide-details
                      density="compact"
                    />
                  </template>
                </v-list-item>

                <v-list-item class="pl-12">
                  <v-list-item-title class="text-body-2">Pruning Reminders ✂️</v-list-item-title>
                  <template #append>
                    <v-switch
                      v-model="notificationDetails.pruning"
                      @update:model-value="saveNotificationDetails"
                      color="primary"
                      hide-details
                      density="compact"
                    />
                  </template>
                </v-list-item>

                <v-list-item class="pl-12">
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-bell-ring"
                    @click="sendTestNotificationHandler"
                    :loading="testingNotification"
                  >
                    Send Test Notification
                  </v-btn>
                </v-list-item>
              </template>

              <v-divider />

              <!-- Location Services -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-map-marker</v-icon>
                </template>

                <v-list-item-title>Location Services</v-list-item-title>
                <v-list-item-subtitle> Enable weather data for your area </v-list-item-subtitle>

                <template #append>
                  <v-switch
                    v-model="settings.location"
                    @update:model-value="updateLocationSettings"
                    color="primary"
                    hide-details
                  />
                </template>
              </v-list-item>

              <v-divider />

              <!-- Dark Mode -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-theme-light-dark</v-icon>
                </template>

                <v-list-item-title>Dark Mode</v-list-item-title>
                <v-list-item-subtitle> Switch between light and dark themes </v-list-item-subtitle>

                <template #append>
                  <v-switch
                    v-model="settings.darkMode"
                    @update:model-value="toggleTheme"
                    color="primary"
                    hide-details
                  />
                </template>
              </v-list-item>

              <v-divider />

              <!-- Reminder Time -->
              <v-list-item @click="showTimeDialog = true">
                <template #prepend>
                  <v-icon>mdi-clock</v-icon>
                </template>

                <v-list-item-title>Daily Reminder Time</v-list-item-title>
                <v-list-item-subtitle>
                  {{ settings.reminderTime }}
                </v-list-item-subtitle>

                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>

              <v-divider />

              <!-- Temperature Unit -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-thermometer</v-icon>
                </template>

                <v-list-item-title>Temperature Unit</v-list-item-title>
                <v-list-item-subtitle> Choose Celsius or Fahrenheit </v-list-item-subtitle>

                <template #append>
                  <v-btn-toggle
                    v-model="settings.temperatureUnit"
                    @update:model-value="updateTemperatureUnit"
                    mandatory
                    density="compact"
                  >
                    <v-btn value="celsius" size="small">°C</v-btn>
                    <v-btn value="fahrenheit" size="small">°F</v-btn>
                  </v-btn-toggle>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Account -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Account
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list>
              <v-list-item @click="showDeleteDialog = true">
                <template #prepend>
                  <v-icon color="error">mdi-delete</v-icon>
                </template>

                <v-list-item-title class="text-error"> Delete Account </v-list-item-title>
                <v-list-item-subtitle>
                  Permanently delete your account and data
                </v-list-item-subtitle>

                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Support Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-help-circle</v-icon>
            Support & Info
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list>
              <v-list-item @click="openHelp">
                <template #prepend>
                  <v-icon>mdi-book-open-variant</v-icon>
                </template>

                <v-list-item-title>Help & FAQ</v-list-item-title>
                <v-list-item-subtitle> Get answers to common questions </v-list-item-subtitle>

                <template #append>
                  <v-icon>mdi-open-in-new</v-icon>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item @click="sendFeedback">
                <template #prepend>
                  <v-icon>mdi-message</v-icon>
                </template>

                <v-list-item-title>Send Feedback</v-list-item-title>
                <v-list-item-subtitle> Help us improve the app </v-list-item-subtitle>

                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-information</v-icon>
                </template>

                <v-list-item-title>App Version</v-list-item-title>
                <v-list-item-subtitle> Plant Care Tracker v1.0.0 </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Logout Button -->
    <v-row>
      <v-col cols="12">
        <v-btn
          @click="logout"
          color="error"
          variant="outlined"
          size="large"
          block
          prepend-icon="mdi-logout"
        >
          Sign Out
        </v-btn>
      </v-col>
    </v-row>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="showEditProfile" max-width="500">
      <v-card>
        <v-card-title>Edit Profile</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editForm.displayName"
            label="Display Name"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="editForm.email"
            label="Email"
            variant="outlined"
            disabled
            hint="Email cannot be changed"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEditProfile = false">Cancel</v-btn>
          <v-btn @click="saveProfile" color="primary">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Time Picker Dialog -->
    <v-dialog v-model="showTimeDialog" max-width="300">
      <v-card>
        <v-card-title>Set Reminder Time</v-card-title>
        <v-card-text>
          <v-time-picker v-model="selectedTime" format="ampm" width="100%" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTimeDialog = false">Cancel</v-btn>
          <v-btn @click="saveReminderTime" color="primary">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Account Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">Delete Account</v-card-title>
        <v-card-text>
          <p class="mb-4">
            This action cannot be undone. All your plants, photos, and data will be permanently
            deleted.
          </p>
          <v-text-field
            v-model="deleteConfirmation"
            label="Type 'DELETE' to confirm"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn @click="deleteAccount" :disabled="deleteConfirmation !== 'DELETE'" color="error">
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" :timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { onAuthStateChanged, signOut, updateProfile, deleteUser } from 'firebase/auth'
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'
import {
  requestPermissionAndToken,
  sendTestNotification,
  updateNotificationSettings as updateNotificationSettingsFirestore,
  getNotificationStatus,
} from '@/services/notificationService'

const router = useRouter()
const theme = useTheme()

// Reactive data
const user = ref(null)
const showEditProfile = ref(false)
const showTimeDialog = ref(false)
const showDeleteDialog = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const deleteConfirmation = ref('')
const selectedTime = ref('9:00')
const testingNotification = ref(false)

// Settings
const settings = ref({
  notifications: true,
  location: true,
  darkMode: false,
  reminderTime: '9:00 AM',
  temperatureUnit: 'fahrenheit',
})

// Notification detail settings
const notificationDetails = ref({
  watering: true,
  fertilizer: true,
  pruning: true,
})

// Edit form
const editForm = ref({
  displayName: '',
  email: '',
})

// Settings handlers
const updateNotificationSettings = async (enabled) => {
  if (enabled && user.value) {
    try {
      // Request FCM permission and token
      const token = await requestPermissionAndToken(user.value.uid)
      if (token) {
        showSuccess.value = true
        successMessage.value = 'Notifications enabled! 🔔'
      } else {
        // Fallback to basic notification permission
        if ('Notification' in window) {
          await Notification.requestPermission()
        }
        showSuccess.value = true
        successMessage.value = 'Notifications enabled'
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      showSuccess.value = true
      successMessage.value = 'Notifications enabled (basic mode)'
    }
  } else {
    // Disable notifications
    if (user.value) {
      await updateNotificationSettingsFirestore(user.value.uid, {
        enabled: false,
        ...notificationDetails.value,
      })
    }
    showSuccess.value = true
    successMessage.value = 'Notifications disabled'
  }
}

// Save notification detail preferences
const saveNotificationDetails = async () => {
  if (user.value) {
    await updateNotificationSettingsFirestore(user.value.uid, {
      enabled: settings.value.notifications,
      wateringReminders: notificationDetails.value.watering,
      fertilizerReminders: notificationDetails.value.fertilizer,
      pruningReminders: notificationDetails.value.pruning,
    })
  }
}

// Send test notification
const sendTestNotificationHandler = async () => {
  testingNotification.value = true
  try {
    // Get user's first plant for testing
    const plantsQuery = query(
      collection(db, 'plants'),
      where('userId', '==', user.value.uid),
      limit(1),
    )
    const snapshot = await getDocs(plantsQuery)

    if (!snapshot.empty) {
      const plant = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      const success = await sendTestNotification(plant, 'watering')
      if (success) {
        showSuccess.value = true
        successMessage.value = 'Test notification sent! 🌱'
      } else {
        showSuccess.value = true
        successMessage.value = 'Please allow notifications first'
      }
    } else {
      // No plants, use a sample
      const success = await sendTestNotification(null, 'watering')
      if (success) {
        showSuccess.value = true
        successMessage.value = 'Test notification sent! 🌱'
      }
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
    showSuccess.value = true
    successMessage.value = 'Error sending test notification'
  } finally {
    testingNotification.value = false
  }
}

const updateLocationSettings = async (enabled) => {
  try {
    if (enabled && 'geolocation' in navigator) {
      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        })
      })

      // Save location preference to Firestore
      if (user.value) {
        const userRef = doc(db, 'users', user.value.uid)
        await updateDoc(userRef, {
          locationEnabled: true,
          lastLocation: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: new Date(),
          },
        })
      }

      showSuccess.value = true
      successMessage.value = 'Location access enabled'
    } else {
      // Save disabled preference
      if (user.value) {
        const userRef = doc(db, 'users', user.value.uid)
        await updateDoc(userRef, { locationEnabled: false })
      }

      showSuccess.value = true
      successMessage.value = 'Location access disabled'
    }
  } catch (error) {
    console.error('Location error:', error)
    settings.value.location = false
    showSuccess.value = true
    successMessage.value = 'Location access denied'
  }
}

const toggleTheme = (isDark) => {
  theme.global.name.value = isDark ? 'dark' : 'light'
  showSuccess.value = true
  successMessage.value = `${isDark ? 'Dark' : 'Light'} mode enabled`
}

const updateTemperatureUnit = (unit) => {
  showSuccess.value = true
  successMessage.value = `Temperature unit set to ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}`
}

const saveReminderTime = () => {
  settings.value.reminderTime = selectedTime.value
  showTimeDialog.value = false
  showSuccess.value = true
  successMessage.value = 'Reminder time updated'
}

// Profile actions
const saveProfile = async () => {
  try {
    if (user.value) {
      await updateProfile(user.value, {
        displayName: editForm.value.displayName,
      })
      showEditProfile.value = false
      showSuccess.value = true
      successMessage.value = 'Profile updated successfully'
    }
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}

const deleteAccount = async () => {
  try {
    if (user.value) {
      await deleteUser(user.value)
      router.push('/')
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    showSuccess.value = true
    successMessage.value = 'Error deleting account. Please try again.'
  }
}

// Support actions
const openHelp = () => {
  window.open('https://plantcaretracker.com/help', '_blank')
}

const sendFeedback = () => {
  window.open('mailto:umesh006@umn.edu?subject=Feedback_Plant_Tacker', '_blank')
}

// Logout
const logout = async () => {
  try {
    await signOut(auth)
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

// Initialize
onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      editForm.value = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
      }

      // Load notification settings from Firestore
      try {
        const status = await getNotificationStatus(currentUser.uid)
        settings.value.notifications = status.enabled
        if (status.settings) {
          notificationDetails.value = {
            watering: status.settings.wateringReminders ?? true,
            fertilizer: status.settings.fertilizerReminders ?? true,
            pruning: status.settings.pruningReminders ?? true,
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }
  })
})
</script>

<style scoped>
.settings-container {
  padding-top: 16px;
  padding-bottom: 100px; /* Account for bottom navigation */
}

@media (max-width: 600px) {
  .settings-container {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
