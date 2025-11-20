<template>
  <v-app>
    <v-main>
      <v-container fluid class="onboarding-container">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4">
            <!-- Progress Indicator -->
            <v-card class="mb-6" elevation="0">
              <v-card-text class="text-center pb-0">
                <v-progress-linear
                  :model-value="progress"
                  color="primary"
                  height="6"
                  rounded
                  class="mb-4"
                />
                <div class="text-caption text-medium-emphasis">
                  Step {{ currentStep + 1 }} of {{ totalSteps }}
                </div>
              </v-card-text>
            </v-card>

            <!-- Onboarding Steps -->
            <v-card elevation="4" class="onboarding-card">
              <v-card-text class="pa-8">
                <!-- Step 1: Location Permissions -->
                <div v-if="currentStep === 0" class="text-center">
                  <v-icon size="80" color="primary" class="mb-4"> mdi-map-marker </v-icon>
                  <h2 class="text-h4 mb-4 text-primary">Share Your Location</h2>
                  <p class="text-body-1 mb-6 text-medium-emphasis">
                    We'll use your location to provide weather-based watering tips and care
                    recommendations tailored to your area.
                  </p>

                  <v-alert v-if="locationError" type="warning" variant="tonal" class="mb-4">
                    {{ locationError }}
                  </v-alert>

                  <div class="d-flex flex-column gap-3">
                    <v-btn
                      @click="requestLocationPermission"
                      color="primary"
                      size="large"
                      block
                      :loading="requestingLocation"
                      prepend-icon="mdi-crosshairs-gps"
                      class="text-none"
                    >
                      Allow Location Access
                    </v-btn>

                    <v-btn
                      @click="nextStep"
                      variant="outlined"
                      size="large"
                      block
                      class="text-none"
                    >
                      Skip for Now
                    </v-btn>
                  </div>
                </div>

                <!-- Step 2: Notification Permissions -->
                <div v-else-if="currentStep === 1" class="text-center">
                  <v-icon size="80" color="primary" class="mb-4"> mdi-bell-ring </v-icon>
                  <h2 class="text-h4 mb-4 text-primary">Stay Notified</h2>
                  <p class="text-body-1 mb-6 text-medium-emphasis">
                    Get timely reminders to water your plants and receive helpful care tips to keep
                    them healthy and thriving.
                  </p>

                  <v-alert v-if="notificationError" type="warning" variant="tonal" class="mb-4">
                    {{ notificationError }}
                  </v-alert>

                  <div class="d-flex flex-column gap-3">
                    <v-btn
                      @click="requestNotificationPermission"
                      color="primary"
                      size="large"
                      block
                      :loading="requestingNotifications"
                      prepend-icon="mdi-bell"
                      class="text-none"
                    >
                      Enable Notifications
                    </v-btn>

                    <v-btn
                      @click="nextStep"
                      variant="outlined"
                      size="large"
                      block
                      class="text-none"
                    >
                      Maybe Later
                    </v-btn>
                  </div>
                </div>

                <!-- Step 3: Add First Plant -->
                <div v-else-if="currentStep === 2" class="text-center">
                  <v-icon size="80" color="primary" class="mb-4"> mdi-sprout </v-icon>
                  <h2 class="text-h4 mb-4 text-primary">Add Your First Plant</h2>
                  <p class="text-body-1 mb-6 text-medium-emphasis">
                    Let's get started by adding your first plant! We'll help you set up a care
                    schedule and track its progress.
                  </p>

                  <!-- Plant Frame Illustration -->
                  <div class="plant-frame mb-6">
                    <v-card
                      class="plant-placeholder"
                      variant="outlined"
                      :style="{
                        borderStyle: 'dashed',
                        borderColor: 'rgb(var(--v-theme-primary))',
                        backgroundColor: 'rgba(var(--v-theme-primary), 0.05)',
                      }"
                    >
                      <v-card-text class="pa-6">
                        <v-icon size="48" color="primary" class="mb-2"> mdi-camera-outline </v-icon>
                        <div class="text-body-2 text-medium-emphasis">
                          Tap to add your first plant
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>

                  <div class="d-flex flex-column gap-3">
                    <v-btn
                      @click="showAddPlantDialog = true"
                      color="primary"
                      size="large"
                      block
                      prepend-icon="mdi-plus"
                      class="text-none"
                    >
                      Add My First Plant
                    </v-btn>

                    <v-btn
                      @click="completeOnboarding"
                      variant="outlined"
                      size="large"
                      block
                      class="text-none"
                    >
                      I'll Add Plants Later
                    </v-btn>
                  </div>
                </div>

                <!-- Navigation Buttons -->
                <div v-if="currentStep > 0" class="mt-6 pt-4">
                  <div class="d-flex justify-space-between">
                    <v-btn
                      @click="previousStep"
                      variant="text"
                      prepend-icon="mdi-chevron-left"
                      class="text-none"
                    >
                      Back
                    </v-btn>

                    <v-btn
                      v-if="currentStep < totalSteps - 1"
                      @click="nextStep"
                      variant="text"
                      append-icon="mdi-chevron-right"
                      class="text-none"
                    >
                      Skip
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Welcome Back Message -->
            <div class="text-center mt-6" v-if="user">
              <div class="text-h6 text-primary mb-2">
                Welcome, {{ user.displayName || user.email }}! 🌱
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Let's set up your plant care journey
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Add Plant Dialog -->
        <v-dialog v-model="showAddPlantDialog" max-width="600" persistent>
          <AddPlantDialog
            @close="showAddPlantDialog = false"
            @plant-added="onFirstPlantAdded"
            :is-first-plant="true"
          />
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import AddPlantDialog from '@/components/AddPlantDialog.vue'

const router = useRouter()

// Reactive data
const currentStep = ref(0)
const totalSteps = ref(3)
const user = ref(null)
const showAddPlantDialog = ref(false)

// Location permission
const requestingLocation = ref(false)
const locationError = ref('')
const userLocation = ref(null)

// Notification permission
const requestingNotifications = ref(false)
const notificationError = ref('')
const notificationsEnabled = ref(false)

// Computed
const progress = computed(() => ((currentStep.value + 1) / totalSteps.value) * 100)

// Get current user and check onboarding status
onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      
      // Check if user has already completed onboarding
      try {
        const userRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
          // User has already completed onboarding, redirect to main app
          router.push('/app/home')
          return
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // Continue with onboarding if there's an error
      }
    } else {
      router.push('/')
    }
  })
})

// Navigation methods
const nextStep = () => {
  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++
  } else {
    completeOnboarding()
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Request location permission
const requestLocationPermission = async () => {
  requestingLocation.value = true
  locationError.value = ''

  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      })
    })

    userLocation.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }

    // Save location to user profile
    if (user.value) {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, {
        location: userLocation.value,
        locationPermissionGranted: true,
        updatedAt: new Date(),
      })
    }

    nextStep()
  } catch (error) {
    console.error('Location permission error:', error)
    locationError.value = getLocationErrorMessage(error)
  } finally {
    requestingLocation.value = false
  }
}

// Request notification permission
const requestNotificationPermission = async () => {
  requestingNotifications.value = true
  notificationError.value = ''

  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      notificationsEnabled.value = true

      // Save notification preference to user profile
      if (user.value) {
        const userRef = doc(db, 'users', user.value.uid)
        await updateDoc(userRef, {
          notificationsEnabled: true,
          notificationPermissionGranted: true,
          updatedAt: new Date(),
        })
      }

      nextStep()
    } else {
      throw new Error('Notification permission denied')
    }
  } catch (error) {
    console.error('Notification permission error:', error)
    notificationError.value = getNotificationErrorMessage(error)
  } finally {
    requestingNotifications.value = false
  }
}

// Handle first plant added
const onFirstPlantAdded = () => {
  showAddPlantDialog.value = false
  completeOnboarding()
}

// Complete onboarding
const completeOnboarding = async () => {
  try {
    // Mark onboarding as completed in user profile
    if (user.value) {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Redirect to main app
    router.push('/app/home')
  } catch (error) {
    console.error('Error completing onboarding:', error)
    // Still redirect even if update fails
    router.push('/app/home')
  }
}

// Error message helpers
const getLocationErrorMessage = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. You can enable it later in settings.'
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable. Please try again.'
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.'
    default:
      return 'Unable to retrieve your location. You can continue without it.'
  }
}

const getNotificationErrorMessage = (error) => {
  if (error.message.includes('not support')) {
    return 'Your browser does not support notifications.'
  }
  return 'Unable to enable notifications. You can enable them later in settings.'
}
</script>

<style scoped>
.onboarding-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

.onboarding-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 195, 74, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.onboarding-card {
  position: relative;
  border-radius: 16px !important;
}

.plant-frame {
  max-width: 200px;
  margin: 0 auto;
}

.plant-placeholder {
  border-radius: 12px !important;
  cursor: pointer;
  transition: all 0.3s ease;
}

.plant-placeholder:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fill-height {
  min-height: 100vh;
}

.gap-3 {
  gap: 12px;
}

.v-btn {
  border-radius: 12px !important;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .onboarding-card .v-card-text {
    padding: 24px 20px !important;
  }

  .text-h4 {
    font-size: 1.5rem !important;
  }
}
</style>
