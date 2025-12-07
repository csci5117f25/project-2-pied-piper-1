<template>
  <v-container fluid class="home-container">
    <!-- Header with Weather and Profile -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <!-- Enhanced Weather Widget -->
        <WeatherWidget 
          :temperature="22" 
          condition="Sunny" 
          location="Minneapolis, MN"
          :humidity="65"
          :wind-speed="8"
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
        <CalendarWidget 
          :plants="plants" 
          @day-selected="onDaySelected"
        />
      </v-col>
    </v-row>

    <!-- Plants to Water Today -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-sprout</v-icon>
            Plants to Water Today
            <v-spacer></v-spacer>
            <v-chip :color="plantsToday.length > 0 ? 'primary' : 'grey'" size="small">
              {{ plantsToday.length }}
            </v-chip>
          </v-card-title>

          <v-card-text v-if="plantsToday.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-2" class="mb-4"> mdi-check-circle </v-icon>
            <div class="text-h6 text-medium-emphasis mb-2">All caught up! 🎉</div>
            <div class="text-body-2 text-medium-emphasis">
              No plants need watering today. Great job!
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
                  />
                  <v-btn
                    @click="skipPlantWatering(plant)"
                    icon="mdi-close"
                    size="small"
                    color="warning"
                    variant="tonal"
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
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import WeatherWidget from '@/components/WeatherWidget.vue'
import CalendarWidget from '@/components/CalendarWidget.vue'

// Reactive data
const user = ref(null)
const selectedDate = ref(new Date())
const showSuccess = ref(false)
const successMessage = ref('')
const plants = ref([])

// Calendar event handler
const onDaySelected = (day) => {
  selectedDate.value = day.date
  console.log('Selected day:', day.fullDate)
}

// Check if a plant needs watering
const needsWatering = (plant) => {
  if (!plant.lastWatered) {
    // If never watered, it needs water
    return true
  }

  if (!plant.wateringFrequency) {
    // Default to weekly if no frequency set
    return false
  }

  const lastWateredDate = plant.lastWatered.toDate ? plant.lastWatered.toDate() : new Date(plant.lastWatered)
  const now = new Date()
  const daysSinceWatering = Math.floor((now - lastWateredDate) / (1000 * 60 * 60 * 24))

  // Determine days based on watering frequency
  let daysUntilNextWatering
  switch (plant.wateringFrequency) {
    case 'daily':
      daysUntilNextWatering = 1
      break
    case 'frequent':
      daysUntilNextWatering = 2.5 // Average of 2-3 days
      break
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

  return daysSinceWatering >= daysUntilNextWatering
}

// Plants that need watering today
const plantsToday = computed(() => {
  return plants.value.filter((plant) => needsWatering(plant))
})

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
