<template>
  <v-container fluid class="settings-container">
    <!-- Modern Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <v-icon size="24">mdi-cog</v-icon>
        </div>
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Manage your account and app preferences</p>
        </div>
      </div>
    </div>

    <!-- User Profile Section -->
    <div class="settings-card">
      <div class="card-header">
        <v-icon size="20">mdi-account</v-icon>
        <span>Profile</span>
      </div>

      <div class="profile-section">
        <v-avatar size="72" class="profile-avatar">
          <img
            v-if="user?.photoURL"
            :src="user.photoURL"
            :alt="user.displayName"
            style="object-fit: cover; width: 100%; height: 100%"
          />
          <v-icon v-else size="40">mdi-account-circle</v-icon>
        </v-avatar>

        <div class="profile-info">
          <h3 class="profile-name">{{ user?.displayName || 'Plant Lover' }}</h3>
          <p class="profile-email">{{ user?.email }}</p>
          <div class="member-badge">
            <v-icon size="12">mdi-calendar</v-icon>
            Member since {{ formatDate(user?.metadata?.creationTime) }}
          </div>
        </div>

        <v-btn
          @click="showEditProfile = true"
          variant="tonal"
          color="primary"
          rounded="lg"
          prepend-icon="mdi-pencil"
        >
          Edit
        </v-btn>
      </div>
    </div>

    <!-- App Settings -->
    <div class="settings-card">
      <div class="card-header">
        <v-icon size="20">mdi-tune-variant</v-icon>
        <span>App Preferences</span>
      </div>

      <v-list class="pa-0">
        <!-- Notifications -->
        <v-list-item>
          <template #prepend>
            <v-icon>mdi-bell</v-icon>
          </template>

          <v-list-item-title>Push Notifications</v-list-item-title>
          <v-list-item-subtitle> Get reminders for watering and care tasks </v-list-item-subtitle>

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
          <v-list-item-subtitle>Enable weather data for your area</v-list-item-subtitle>

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
          <v-list-item-subtitle>Switch between light and dark themes</v-list-item-subtitle>

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
          <v-list-item-subtitle>Choose Celsius or Fahrenheit</v-list-item-subtitle>

          <template #append>
            <v-btn-toggle
              v-model="settings.temperatureUnit"
              @update:model-value="updateTemperatureUnit"
              mandatory
              density="compact"
              rounded="lg"
            >
              <v-btn value="celsius" size="small">°C</v-btn>
              <v-btn value="fahrenheit" size="small">°F</v-btn>
            </v-btn-toggle>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- Account -->
    <div class="settings-card">
      <div class="card-header">
        <v-icon size="20">mdi-shield-account</v-icon>
        <span>Account</span>
      </div>

      <v-list class="pa-0">
        <v-list-item @click="showDeleteDialog = true">
          <template #prepend>
            <v-icon color="error">mdi-delete-outline</v-icon>
          </template>

          <v-list-item-title class="text-error">Delete Account</v-list-item-title>
          <v-list-item-subtitle> Permanently delete your account and data </v-list-item-subtitle>

          <template #append>
            <v-icon size="18">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- Support Section -->
    <div class="settings-card">
      <div class="card-header">
        <v-icon size="20">mdi-help-circle-outline</v-icon>
        <span>Support & Info</span>
      </div>

      <v-list class="pa-0">
        <v-list-item @click="openHelp">
          <template #prepend>
            <v-icon>mdi-book-open-page-variant-outline</v-icon>
          </template>

          <v-list-item-title>Help & FAQ</v-list-item-title>
          <v-list-item-subtitle>Get answers to common questions</v-list-item-subtitle>

          <template #append>
            <v-icon size="18">mdi-open-in-new</v-icon>
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item @click="sendFeedback">
          <template #prepend>
            <v-icon>mdi-message</v-icon>
          </template>

          <v-list-item-title>Send Feedback</v-list-item-title>
          <v-list-item-subtitle>Help us improve the app</v-list-item-subtitle>

          <template #append>
            <v-icon size="18">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-icon>mdi-information-outline</v-icon>
          </template>

          <v-list-item-title>App Version</v-list-item-title>
          <v-list-item-subtitle>Plant Care Tracker v1.0.0</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>

    <!-- Logout Button -->
    <v-btn
      @click="logout"
      color="error"
      variant="outlined"
      size="large"
      block
      rounded="lg"
      prepend-icon="mdi-logout"
      class="logout-btn"
    >
      Sign Out
    </v-btn>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="showEditProfile" max-width="500">
      <v-card class="dialog-card">
        <v-card-title>Edit Profile</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editForm.displayName"
            label="Display Name"
            variant="outlined"
            class="mb-4"
            rounded="lg"
          />
          <v-text-field
            v-model="editForm.email"
            label="Email"
            variant="outlined"
            disabled
            hint="Email cannot be changed"
            persistent-hint
            rounded="lg"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEditProfile = false" rounded="lg">Cancel</v-btn>
          <v-btn @click="saveProfile" color="primary">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Time Picker Dialog -->
    <v-dialog v-model="showTimeDialog" max-width="400">
      <v-card>
        <v-card-title>Set Reminder Time</v-card-title>
        <v-card-text class="pa-0">
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
const selectedTime = ref('11:00')
const testingNotification = ref(false)

// Settings
const settings = ref({
  notifications: true,
  location: true,
  darkMode: false,
  reminderTime: '11:00 AM',
  temperatureUnit: 'celsius',
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
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
             showSuccess.value = true
             successMessage.value = 'Notifications enabled (local only)'
          } else {
             settings.value.notifications = false
             showSuccess.value = true
             successMessage.value = 'Permission denied'
          }
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      showSuccess.value = true
      successMessage.value = 'Error enabling notifications'
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
    // Ensure we have a token first
    if (user.value) {
       const token = await requestPermissionAndToken(user.value.uid)
       if (!token) {
          showSuccess.value = true
          successMessage.value = 'Please enable notifications first'
          testingNotification.value = false
          return
       }
    }

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

const toggleTheme = async (isDark) => {
  theme.global.name.value = isDark ? 'dark' : 'light'
  // Save to localStorage for immediate persistence
  localStorage.setItem('darkMode', isDark.toString())

  // Save to Firestore for cross-device sync
  if (user.value) {
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, { darkMode: isDark })
    } catch (error) {
      console.error('Error saving dark mode preference:', error)
    }
  }

  showSuccess.value = true
  successMessage.value = `${isDark ? 'Dark' : 'Light'} mode enabled`
}

const updateTemperatureUnit = async (unit) => {
  // Save to Firestore
  if (user.value) {
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, { temperatureUnit: unit })
    } catch (error) {
      console.error('Error saving temperature unit:', error)
    }
  }

  showSuccess.value = true
  successMessage.value = `Temperature unit set to ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}`
}

const saveReminderTime = async () => {
  settings.value.reminderTime = selectedTime.value
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Save to Firestore
  if (user.value) {
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, { 
        reminderTime: selectedTime.value,
        timeZone
      })
    } catch (error) {
      console.error('Error saving reminder time:', error)
    }
  }

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
  // Load dark mode from localStorage immediately
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    const isDark = savedDarkMode === 'true'
    settings.value.darkMode = isDark
    theme.global.name.value = isDark ? 'dark' : 'light'
  }

  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      editForm.value = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
      }

      // Load all settings from Firestore
      try {
        const userRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()

          // Load dark mode (Firestore overrides localStorage)
          if (userData.darkMode !== undefined) {
            settings.value.darkMode = userData.darkMode
            theme.global.name.value = userData.darkMode ? 'dark' : 'light'
            localStorage.setItem('darkMode', userData.darkMode.toString())
          }

          // Load location setting
          if (userData.locationEnabled !== undefined) {
            settings.value.location = userData.locationEnabled
          }

          // Load temperature unit
          if (userData.temperatureUnit) {
            settings.value.temperatureUnit = userData.temperatureUnit
          }

          // Load reminder time
          if (userData.reminderTime) {
            settings.value.reminderTime = userData.reminderTime
            selectedTime.value = userData.reminderTime
          }
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
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
  padding-top: 20px;
  padding-bottom: 100px;
}

/* Page Header */
.page-header {
  margin-bottom: 28px;
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
  background: rgba(var(--v-theme-on-surface), 0.08);
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

/* Settings Card */
.settings-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* Profile Section */
.profile-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 20px;
}

.profile-avatar {
  border: 3px solid rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin: 0 0 4px 0;
}

.profile-email {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 8px 0;
}

.member-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
}

/* Settings List Items */
.settings-card :deep(.v-list-item) {
  padding: 16px 20px;
}

.settings-card :deep(.v-list-item-title) {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.settings-card :deep(.v-list-item-subtitle) {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Logout Button */
.settings-container :deep(.v-btn--block) {
  border-radius: var(--radius-lg, 12px);
  font-weight: 600;
}

/* Dialogs */
.settings-container :deep(.v-dialog .v-card) {
  border-radius: var(--radius-xl, 16px);
}

.settings-container :deep(.v-dialog .v-card-title) {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 600px) {
  .settings-container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .profile-section {
    flex-direction: column;
    text-align: center;
  }

  .profile-info {
    text-align: center;
  }

  .member-badge {
    margin-top: 4px;
  }
}
</style>
