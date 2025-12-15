<template>
  <div class="home-page">
    <!-- Hero Section with Greeting -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="greeting">
          <span class="greeting-emoji">{{ getGreetingEmoji() }}</span>
          <div>
            <h1 class="greeting-text">{{ getGreeting() }}</h1>
            <p class="greeting-subtitle">{{ user?.displayName || 'Plant Lover' }}</p>
          </div>
        </div>
        <v-btn
          @click="$router.push('/app/settings')"
          icon
          variant="tonal"
          size="44"
          class="profile-btn"
        >
          <v-avatar size="36">
            <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" />
            <v-icon v-else color="primary">mdi-account</v-icon>
          </v-avatar>
        </v-btn>
      </div>
    </div>

    <v-container fluid class="home-container">
      <!-- Weather Widget -->
      <div class="section-spacing">
        <WeatherWidget
          :weather-data="weatherData"
          :recommendation="wateringRecommendation"
          :loading="weatherLoading"
          :error="weatherError"
          :temperature-unit="temperatureUnit"
          @retry="fetchWeatherData"
        />
      </div>

      <!-- Calendar Widget -->
      <div class="section-spacing">
        <CalendarWidget :plants="plants" @day-selected="onDaySelected" />
      </div>

      <!-- Plants to Water Section -->
      <div class="section-spacing">
        <div class="section-header">
          <div class="section-title">
            <v-icon class="section-icon" color="primary">mdi-water-outline</v-icon>
            <span>{{ sectionTitle }}</span>
          </div>
          <v-chip
            :color="plantsToday.length > 0 ? 'primary' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ plantsToday.length }} {{ plantsToday.length === 1 ? 'plant' : 'plants' }}
          </v-chip>
        </div>

        <!-- Empty State -->
        <div v-if="plantsToday.length === 0" class="empty-state">
          <div class="empty-icon">🎉</div>
          <h3 class="empty-title">All caught up!</h3>
          <p class="empty-subtitle">{{ selectedDateText }}</p>
        </div>

        <!-- Plant Cards -->
        <div v-else class="plants-grid">
          <div
            v-for="plant in plantsToday"
            :key="plant.id"
            class="plant-card"
            @click="$router.push(`/app/plants/${plant.id}`)"
          >
            <div class="plant-card-inner">
              <!-- Plant Image -->
              <div class="plant-image-wrapper">
                <img
                  v-if="plant.photoURL"
                  :src="plant.photoURL"
                  :alt="plant.nickname"
                  class="plant-image"
                />
                <div v-else class="plant-placeholder">
                  <v-icon size="32" color="primary">mdi-leaf</v-icon>
                </div>
              </div>

              <!-- Plant Info -->
              <div class="plant-info">
                <h4 class="plant-name">{{ plant.nickname }}</h4>
                <p class="plant-type">{{ plant.plantType }}</p>
                <div class="plant-location">
                  <v-icon size="12">mdi-map-marker-outline</v-icon>
                  {{ plant.location }}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="plant-actions" @click.stop>
                <v-btn
                  @click="completePlantWatering(plant)"
                  icon
                  size="36"
                  color="success"
                  variant="flat"
                  :disabled="!isSelectedDateToday"
                  class="action-btn"
                >
                  <v-icon size="18">mdi-check</v-icon>
                </v-btn>
                <v-btn
                  @click="skipPlantWatering(plant)"
                  icon
                  size="36"
                  color="warning"
                  variant="tonal"
                  :disabled="!isSelectedDateToday"
                  class="action-btn"
                >
                  <v-icon size="18">mdi-clock-outline</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plants Needing Fertilizer Section -->
      <div v-if="plantsNeedingFertilizer.length > 0" class="section-spacing">
        <div class="section-header">
          <div class="section-title">
            <v-icon class="section-icon" color="success">mdi-bottle-tonic</v-icon>
            <span>{{ fertilizerSectionTitle }}</span>
          </div>
          <v-chip color="success" size="small" variant="tonal">
            {{ plantsNeedingFertilizer.length }}
            {{ plantsNeedingFertilizer.length === 1 ? 'plant' : 'plants' }}
          </v-chip>
        </div>

        <div class="plants-grid">
          <div
            v-for="plant in plantsNeedingFertilizer"
            :key="'fert-' + plant.id"
            class="plant-card fertilizer-card"
            @click="$router.push(`/app/plants/${plant.id}`)"
          >
            <div class="plant-card-inner">
              <div class="plant-image-wrapper">
                <img
                  v-if="plant.photoURL"
                  :src="plant.photoURL"
                  :alt="plant.nickname"
                  class="plant-image"
                />
                <div v-else class="plant-placeholder">
                  <v-icon size="32" color="success">mdi-leaf</v-icon>
                </div>
              </div>
              <div class="plant-info">
                <h4 class="plant-name">{{ plant.nickname }}</h4>
                <p class="plant-type">{{ plant.plantType }}</p>
                <div class="plant-location text-success">
                  <v-icon size="12" color="success">mdi-bottle-tonic</v-icon>
                  Fertilizer due
                </div>
              </div>
              <div class="plant-actions" @click.stop>
                <v-btn
                  @click="completeFertilizing(plant)"
                  icon
                  size="36"
                  color="success"
                  variant="flat"
                  :disabled="!isSelectedDateToday"
                  class="action-btn"
                >
                  <v-icon size="18">mdi-check</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plants Needing Maintenance Section -->
      <div v-if="plantsNeedingMaintenance.length > 0" class="section-spacing">
        <div class="section-header">
          <div class="section-title">
            <v-icon class="section-icon" color="amber">mdi-content-cut</v-icon>
            <span>{{ maintenanceSectionTitle }}</span>
          </div>
          <v-chip color="amber" size="small" variant="tonal">
            {{ plantsNeedingMaintenance.length }}
            {{ plantsNeedingMaintenance.length === 1 ? 'plant' : 'plants' }}
          </v-chip>
        </div>

        <div class="plants-grid">
          <div
            v-for="plant in plantsNeedingMaintenance"
            :key="'maint-' + plant.id"
            class="plant-card maintenance-card"
            @click="$router.push(`/app/plants/${plant.id}`)"
          >
            <div class="plant-card-inner">
              <div class="plant-image-wrapper">
                <img
                  v-if="plant.photoURL"
                  :src="plant.photoURL"
                  :alt="plant.nickname"
                  class="plant-image"
                />
                <div v-else class="plant-placeholder">
                  <v-icon size="32" color="amber">mdi-leaf</v-icon>
                </div>
              </div>
              <div class="plant-info">
                <h4 class="plant-name">{{ plant.nickname }}</h4>
                <p class="plant-type">{{ plant.plantType }}</p>
                <div class="plant-location text-amber">
                  <v-icon size="12" color="amber">mdi-content-cut</v-icon>
                  Maintenance due
                </div>
              </div>
              <div class="plant-actions" @click.stop>
                <v-btn
                  @click="completeMaintenance(plant)"
                  icon
                  size="36"
                  color="amber"
                  variant="flat"
                  :disabled="!isSelectedDateToday"
                  class="action-btn"
                >
                  <v-icon size="18">mdi-check</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-container>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" :timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>

    <!-- Achievement Toast -->
    <AchievementToast
      v-model="showAchievementToast"
      :achievement="unlockedAchievement"
      @closed="onAchievementToastClosed"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { handlePlantWatered, handleAllPlantsHealthy } from '@/utils/achievements'
import { logPlantWatered, logAchievementUnlocked } from '@/services/activityService'
import { getWeatherForCurrentLocation } from '@/services/weatherService'
import {
  scheduleLocalNotifications,
  getPlantsNeedingWaterToday,
  getNotificationContent,
  calculateNextNotificationTime,
} from '@/services/notificationService'
import WeatherWidget from '@/components/WeatherWidget.vue'
import CalendarWidget from '@/components/CalendarWidget.vue'
import AchievementToast from '@/components/AchievementToast.vue'

// Helper functions for greeting
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const getGreetingEmoji = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '🌅'
  if (hour < 17) return '☀️'
  return '🌙'
}

// Reactive data
const user = ref(null)
const selectedDate = ref(new Date())
const showSuccess = ref(false)
const successMessage = ref('')
const plants = ref([])

// Achievement toast
const showAchievementToast = ref(false)
const unlockedAchievement = ref(null)
const achievementQueue = ref([])

// Weather data
const weatherData = ref(null)
const wateringRecommendation = ref(null)
const weatherLoading = ref(false)
const weatherError = ref(null)
const temperatureUnit = ref('celsius')

// Show next achievement in queue
const showNextAchievement = () => {
  if (achievementQueue.value.length > 0) {
    unlockedAchievement.value = achievementQueue.value.shift()
    showAchievementToast.value = true
  }
}

// Queue achievements to show
const queueAchievements = (unlocks) => {
  if (!unlocks || unlocks.length === 0) return
  achievementQueue.value.push(...unlocks)
  if (!showAchievementToast.value) {
    showNextAchievement()
  }
}

// Handle achievement toast closed
const onAchievementToastClosed = () => {
  showNextAchievement()
}

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

// Fertilizer section title based on selected date
const fertilizerSectionTitle = computed(() => {
  if (isSelectedDateToday.value) {
    return 'Fertilize Today'
  }
  const date = new Date(selectedDate.value)
  return `Fertilize on ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`
})

// Maintenance section title based on selected date
const maintenanceSectionTitle = computed(() => {
  if (isSelectedDateToday.value) {
    return 'Maintenance Today'
  }
  const date = new Date(selectedDate.value)
  return `Maintenance on ${date.toLocaleDateString('en-US', {
    month: 'short',
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

// Helper to get frequency in weeks
const getFrequencyInWeeks = (frequency, customWeeks, type) => {
  if (frequency === 'custom') return customWeeks || (type === 'fertilizer' ? 4 : 12)

  const frequencyMap = {
    never: null,
    monthly: 4,
    bimonthly: 8,
    quarterly: 13,
    seasonal: 16,
    biannually: 26,
    annually: 52,
  }
  return frequencyMap[frequency] || null
}

// Check if a plant needs fertilizing on a specific date
const needsFertilizingOnDate = (plant, targetDate) => {
  if (!plant.fertilizerFrequency || plant.fertilizerFrequency === 'never') return false

  const weeks = getFrequencyInWeeks(
    plant.fertilizerFrequency,
    plant.customFertilizerWeeks,
    'fertilizer',
  )
  if (!weeks) return false

  const daysInterval = weeks * 7
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = target.getTime() === today.getTime()

  if (!plant.lastFertilized) {
    // Never fertilized - show on today and future dates
    return target >= today
  }

  const lastDate = plant.lastFertilized.toDate
    ? plant.lastFertilized.toDate()
    : new Date(plant.lastFertilized)
  lastDate.setHours(0, 0, 0, 0)

  const daysSince = Math.floor((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  // If overdue, show on today
  if (isToday && daysSince >= daysInterval) {
    return true
  }
  // Show on exact interval days
  return daysSince >= daysInterval && daysSince % daysInterval === 0
}

// Check if a plant needs maintenance on a specific date
const needsMaintenanceOnDate = (plant, targetDate) => {
  if (!plant.maintenanceFrequency || plant.maintenanceFrequency === 'never') return false

  const weeks = getFrequencyInWeeks(
    plant.maintenanceFrequency,
    plant.customMaintenanceWeeks,
    'maintenance',
  )
  if (!weeks) return false

  const daysInterval = weeks * 7
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = target.getTime() === today.getTime()

  if (!plant.lastMaintenance) {
    // Never maintained - show on today and future dates
    return target >= today
  }

  const lastDate = plant.lastMaintenance.toDate
    ? plant.lastMaintenance.toDate()
    : new Date(plant.lastMaintenance)
  lastDate.setHours(0, 0, 0, 0)

  const daysSince = Math.floor((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  // If overdue, show on today
  if (isToday && daysSince >= daysInterval) {
    return true
  }
  // Show on exact interval days
  return daysSince >= daysInterval && daysSince % daysInterval === 0
}

// Plants that need fertilizing on selected date
const plantsNeedingFertilizer = computed(() => {
  const targetDate = selectedDate.value
  return plants.value.filter((plant) => needsFertilizingOnDate(plant, targetDate))
})

// Plants that need maintenance on selected date
const plantsNeedingMaintenance = computed(() => {
  const targetDate = selectedDate.value
  return plants.value.filter((plant) => needsMaintenanceOnDate(plant, targetDate))
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
    // Show appropriate error message based on the issue
    if (error.message?.includes('Geolocation') || error.message?.includes('permission')) {
      weatherError.value = 'Enable location permission in your browser'
    } else {
      weatherError.value = 'Weather data temporarily unavailable'
    }
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
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser

      // Load user preferences including temperature unit
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Set temperature unit (default to celsius)
          temperatureUnit.value = userData.temperatureUnit || 'celsius'
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }

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

    // Log activity and update achievements
    const uid = auth.currentUser?.uid
    if (uid) {
      // Log the watering activity
      logPlantWatered(uid, plant).catch((err) => {
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

      // Collect all unlocked achievements
      const allUnlocks = [...(wateringUnlocks || [])]
      if (greenThumbUnlock) allUnlocks.push(greenThumbUnlock)

      // Log and show toasts for unlocked achievements
      for (const unlock of allUnlocks) {
        logAchievementUnlocked(uid, unlock).catch((err) => {
          console.error('Failed to log achievement unlock:', err)
        })
      }

      // Queue achievement toasts
      if (allUnlocks.length > 0) {
        queueAchievements(allUnlocks)
      }
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

// Fertilizer action
const completeFertilizing = async (plant) => {
  try {
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastFertilized: new Date(),
    })
    showSuccess.value = true
    successMessage.value = `${plant.nickname} fertilized! 🌱`
  } catch (error) {
    console.error('Error fertilizing plant:', error)
  }
}

// Maintenance action
const completeMaintenance = async (plant) => {
  try {
    const plantRef = doc(db, 'plants', plant.id)
    await updateDoc(plantRef, {
      lastMaintenance: new Date(),
    })
    showSuccess.value = true
    successMessage.value = `${plant.nickname} maintenance complete! ✂️`
  } catch (error) {
    console.error('Error completing maintenance:', error)
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding-bottom: 100px;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.85) 100%
  );
  padding: 24px 20px 32px;
  margin-bottom: -16px;
  border-radius: 0 0 24px 24px;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 12px;
}

.greeting-emoji {
  font-size: 2rem;
}

.greeting-text {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.greeting-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 4px 0 0;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Container */
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.section-spacing {
  margin-bottom: 24px;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.125rem;
  color: rgb(var(--v-theme-on-surface));
}

.section-icon {
  opacity: 0.8;
}

/* Empty State */
.empty-state {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 20px;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px;
}

.empty-subtitle {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

/* Plants Grid */
.plants-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Plant Card */
.plant-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.plant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.plant-card-inner {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

/* Plant Image */
.plant-image-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
}

.plant-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-primary), 0.05) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Plant Info */
.plant-info {
  flex: 1;
  min-width: 0;
}

.plant-name {
  font-weight: 600;
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-type {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 4px;
}

.plant-location {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Plant Actions */
.plant-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  box-shadow: none !important;
}

/* Responsive */
@media (max-width: 600px) {
  .hero-section {
    padding: 20px 16px 28px;
  }

  .greeting-emoji {
    font-size: 1.5rem;
  }

  .greeting-text {
    font-size: 1.25rem;
  }

  .home-container {
    padding: 20px 12px;
  }
}
</style>
