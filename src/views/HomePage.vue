<template>
  <v-container fluid class="home-container">
    <!-- Header with Weather and Profile -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <!-- Enhanced Weather Widget -->
        <WeatherWidget
          :weather-data="weatherData"
          :recommendation="wateringRecommendation"
          :loading="weatherLoading"
          :error="weatherError"
          @retry="fetchWeatherData"
        />
      </v-col>

      <v-col cols="12" md="4" class="text-right">
        <!-- User Profile Icon -->
        <v-btn @click="$router.push('/app/settings')" icon size="large" variant="text">
          <v-avatar size="40">
            <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Enhanced Calendar Widget -->
    <v-row class="mb-4">
      <v-col cols="12">
        <CalendarWidget :plants="plants" @day-selected="onDaySelected" />
      </v-col>
    </v-row>

    <!-- Plants to Water -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-sprout</v-icon>
            {{ sectionTitle }}
            <v-spacer></v-spacer>
            <v-chip :color="plantsToday.length > 0 ? 'primary' : 'grey'" size="small">
              {{ plantsToday.length }}
            </v-chip>
          </v-card-title>

          <v-card-text v-if="plantsToday.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-2" class="mb-4"> mdi-check-circle </v-icon>
            <div class="text-h6 text-medium-emphasis mb-2">All caught up! 🎉</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedDateText }}
            </div>
          </v-card-text>

          <v-card-text v-else class="pa-0">
            <div v-for="plant in plantsToday" :key="plant.id" class="plant-card-item">
              <div class="d-flex align-center pa-4">
                <!-- Plant Image -->
                <v-avatar size="48" class="mr-4">
                  <img v-if="plant.photoURL" :src="plant.photoURL" :alt="plant.nickname" />
                  <v-icon v-else color="success">mdi-sprout</v-icon>
                </v-avatar>

                <!-- Plant Info -->
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ plant.nickname }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ plant.plantType }} • {{ plant.location }}
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2">
                  <v-btn
                    @click="completePlantWatering(plant)"
                    icon="mdi-check"
                    size="small"
                    color="success"
                    variant="tonal"
                    :disabled="!isSelectedDateToday"
                  />
                  <v-btn
                    @click="skipPlantWatering(plant)"
                    icon="mdi-close"
                    size="small"
                    color="warning"
                    variant="tonal"
                    :disabled="!isSelectedDateToday"
                  />
                </div>
              </div>

              <v-divider v-if="plantsToday.indexOf(plant) < plantsToday.length - 1"></v-divider>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" :timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { handlePlantWatered, handleAllPlantsHealthy } from '@/utils/achievements'
import { getWeatherForCurrentLocation } from '@/services/weatherService'
import {
  scheduleLocalNotifications,
  getPlantsNeedingWaterToday,
  getNotificationContent,
  calculateNextNotificationTime,
} from '@/services/notificationService'
import WeatherWidget from '@/components/WeatherWidget.vue'
import CalendarWidget from '@/components/CalendarWidget.vue'

// Reactive data
const user = ref(null)
const selectedDate = ref(new Date())
const showSuccess = ref(false)
const successMessage = ref('')
const plants = ref([])

// Weather data
const weatherData = ref(null)
const wateringRecommendation = ref(null)
const weatherLoading = ref(false)
const weatherError = ref(null)

// Calendar event handler
const onDaySelected = (day) => {
  selectedDate.value = day.date
  console.log('Selected day:', day.fullDate)
}

// Check if a plant needs watering on a specific date
const needsWateringOnDate = (plant, targetDate) => {
  if (!plant.lastWatered) {
    // If never watered, it needs water on today and future dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    return target >= today
  }

  if (!plant.wateringFrequency) {
    // If no frequency set, assume it doesn't need watering
    return false
  }

  const lastWateredDate = plant.lastWatered.toDate
    ? plant.lastWatered.toDate()
    : new Date(plant.lastWatered)
  const target = new Date(targetDate)

  // Set both dates to midnight for accurate day comparison
  lastWateredDate.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  const daysSinceWatering = Math.floor((target - lastWateredDate) / (1000 * 60 * 60 * 24))

  // Check if the target date falls exactly on a watering day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = target.getTime() === today.getTime()

  // Handle different watering frequencies
  if (plant.wateringFrequency === 'daily') {
    return daysSinceWatering >= 1
  } else if (plant.wateringFrequency === 'alternate-days') {
    // Every other day (every 2 days)
    return daysSinceWatering >= 1 && daysSinceWatering % 2 === 0
  } else if (plant.wateringFrequency === 'custom') {
    // Custom frequency - use customWateringDays
    const daysUntilNextWatering = plant.customWateringDays || 7
    if (isToday && daysSinceWatering >= daysUntilNextWatering) {
      return true
    }
    return (
      daysSinceWatering >= daysUntilNextWatering && daysSinceWatering % daysUntilNextWatering === 0
    )
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

    // If the plant is overdue (daysSinceWatering > interval), show it on today
    if (isToday && daysSinceWatering >= daysUntilNextWatering) {
      return true
    }
    // Otherwise, show only on exact interval days (7, 14, 21 for weekly, etc.)
    return (
      daysSinceWatering >= daysUntilNextWatering && daysSinceWatering % daysUntilNextWatering === 0
    )
  }
}

// Check if selected date is today
const isSelectedDateToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = new Date(selectedDate.value)
  selected.setHours(0, 0, 0, 0)
  return selected.getTime() === today.getTime()
})

// Section title based on selected date
const sectionTitle = computed(() => {
  if (isSelectedDateToday.value) {
    return 'Plants to Water Today'
  }
  const date = new Date(selectedDate.value)
  return `Plants to Water on ${date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })}`
})

// Empty state text based on selected date
const selectedDateText = computed(() => {
  if (isSelectedDateToday.value) {
    return 'No plants need watering today. Great job!'
  }
  const date = new Date(selectedDate.value)
  return `No plants need watering on ${date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })}.`
})

// Plants that need watering on the selected date
const plantsToday = computed(() => {
  const targetDate = selectedDate.value
  return plants.value.filter((plant) => needsWateringOnDate(plant, targetDate))
})

// Fetch weather data
const fetchWeatherData = async () => {
  weatherLoading.value = true
  weatherError.value = null

  try {
    // Check if user has location enabled in settings
    if (user.value) {
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))
      const userData = userDoc.data()

      if (userData?.locationEnabled === false) {
        weatherError.value = 'Location services disabled in settings'
        return
      }
    }

    const result = await getWeatherForCurrentLocation()
    weatherData.value = result.weather
    wateringRecommendation.value = result.recommendation
  } catch (error) {
    console.error('Error fetching weather:', error)
    weatherError.value = error.message || 'Unable to load weather data'
  } finally {
    weatherLoading.value = false
  }
}

// Check and send daily plant care notifications
const checkAndSendNotifications = async (userId, plantsToCheck) => {
  try {
    // Check if user has notifications enabled
    const userDoc = await getDoc(doc(db, 'users', userId))
    const userData = userDoc.data()

    if (!userData?.notificationsEnabled) {
      console.log('Notifications disabled for user')
      return
    }

    // Check localStorage to see if we've already notified today
    const today = new Date().toDateString()
    const lastNotificationDate = localStorage.getItem('lastNotificationDate')

    if (lastNotificationDate === today) {
      console.log('Already sent notifications today')
      return
    }

    // Get notification preferences
    const settings = userData.notificationSettings || {}
    const wateringEnabled = settings.wateringReminders !== false
    const fertilizerEnabled = settings.fertilizerReminders !== false
    const pruningEnabled = settings.pruningReminders !== false

    // Check for plants needing care
    let notificationsSent = 0

    // Watering notifications
    if (wateringEnabled && plantsToCheck.length > 0) {
      const plantsNeedingWater = getPlantsNeedingWaterToday(plantsToCheck)

      if (plantsNeedingWater.length > 0) {
        // Send a combined notification for all plants or individual ones
        if (plantsNeedingWater.length === 1) {
          const plant = plantsNeedingWater[0]
          const content = getNotificationContent(plant, 'watering')
          new Notification(content.title, {
            body: content.body,
            icon: content.icon,
            badge: '/icon-192x192.png',
            tag: `water-${plant.id}`,
            data: { plantId: plant.id, type: 'watering' },
          })
          notificationsSent++
        } else {
          // Combined notification for multiple plants
          const plantNames = plantsNeedingWater
            .slice(0, 3)
            .map((p) => p.nickname)
            .join(', ')
          const remaining = plantsNeedingWater.length - 3
          const body =
            remaining > 0
              ? `${plantNames} and ${remaining} more need water today! 💧`
              : `${plantNames} need water today! 💧`

          new Notification('🌱 Plant Care Reminder', {
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'daily-watering',
          })
          notificationsSent++
        }
      }
    }

    // Fertilizer notifications (check monthly)
    if (fertilizerEnabled) {
      const plantsNeedingFertilizer = plantsToCheck.filter((plant) => {
        if (!plant.needsFertilizer) return false
        const nextFertilizer = calculateNextNotificationTime(plant, 'fertilizer')
        if (!nextFertilizer) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const fertilizeDate = new Date(nextFertilizer)
        fertilizeDate.setHours(0, 0, 0, 0)
        return fertilizeDate <= today
      })

      if (plantsNeedingFertilizer.length > 0) {
        const plant = plantsNeedingFertilizer[0]
        const content = getNotificationContent(plant, 'fertilizer')
        new Notification(content.title, {
          body: content.body,
          icon: content.icon,
          badge: '/icon-192x192.png',
          tag: `fertilizer-${plant.id}`,
          data: { plantId: plant.id, type: 'fertilizer' },
        })
        notificationsSent++
      }
    }

    // Pruning notifications (check quarterly)
    if (pruningEnabled) {
      const plantsNeedingPruning = plantsToCheck.filter((plant) => {
        if (!plant.needsPruning) return false
        const nextPruning = calculateNextNotificationTime(plant, 'pruning')
        if (!nextPruning) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const pruneDate = new Date(nextPruning)
        pruneDate.setHours(0, 0, 0, 0)
        return pruneDate <= today
      })

      if (plantsNeedingPruning.length > 0) {
        const plant = plantsNeedingPruning[0]
        const content = getNotificationContent(plant, 'pruning')
        new Notification(content.title, {
          body: content.body,
          icon: content.icon,
          badge: '/icon-192x192.png',
          tag: `pruning-${plant.id}`,
          data: { plantId: plant.id, type: 'pruning' },
        })
        notificationsSent++
      }
    }

    // Mark that we've sent notifications today
    if (notificationsSent > 0) {
      localStorage.setItem('lastNotificationDate', today)
      console.log(`Sent ${notificationsSent} notification(s)`)
    }
  } catch (error) {
    console.error('Error checking/sending notifications:', error)
  }
}

// Watch plants array and trigger notification check
watch(
  plants,
  async (newPlants) => {
    if (newPlants.length > 0 && user.value) {
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        checkAndSendNotifications(user.value.uid, newPlants)
      }, 1000)
    }
  },
  { deep: true },
)

// Listen for user and plants
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser

      // Listen for user's plants
      const plantsQuery = query(collection(db, 'plants'), where('userId', '==', currentUser.uid))

      onSnapshot(plantsQuery, (snapshot) => {
        plants.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      })

      // Fetch weather data
      fetchWeatherData()
    }
  })
})

// Plant watering actions
const completePlantWatering = async (plant) => {
  try {
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastWatered: new Date(),
    })

    // Update achievements
    const uid = auth.currentUser?.uid
    if (uid) {
      handlePlantWatered(uid).catch((err) => {
        console.error('Failed to update achievements after watering:', err)
      })
      handleAllPlantsHealthy(uid).catch((err) => {
        console.error('Failed to update Green Thumb achievement:', err)
      })
    }

    showSuccess.value = true
    successMessage.value = `${plant.nickname} watered! 💧`
  } catch (error) {
    console.error('Error updating watering:', error)
  }
}

const skipPlantWatering = async (plant) => {
  try {
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastSkipped: new Date(),
    })
    showSuccess.value = true
    successMessage.value = `Watering skipped for ${plant.nickname}`
  } catch (error) {
    console.error('Error skipping watering:', error)
  }
}
</script>

<style scoped>
.home-container {
  padding-top: 16px;
  padding-bottom: 100px; /* Account for bottom navigation */
}

.plant-card-item {
  transition: background-color 0.2s ease;
}

.plant-card-item:hover {
  background-color: rgba(var(--v-theme-surface), 0.5);
}

.gap-2 {
  gap: 8px;
}

@media (max-width: 600px) {
  .home-container {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
