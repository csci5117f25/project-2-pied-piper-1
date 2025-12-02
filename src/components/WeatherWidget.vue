<template>
  <v-card class="weather-widget" elevation="3">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <!-- Weather Info -->
        <div class="d-flex align-center">
          <div class="weather-icon mr-3">
            <v-icon :icon="weatherIcon" :color="iconColor" size="48"></v-icon>
          </div>
          <div>
            <div class="text-h5 font-weight-bold">{{ temperature }}°C</div>
            <div class="text-subtitle-1 text-medium-emphasis">{{ condition }}</div>
            <div class="text-body-2 text-medium-emphasis d-flex align-center mt-1">
              <v-icon size="14" class="mr-1">mdi-map-marker</v-icon>
              {{ location }}
            </div>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="text-right">
          <div class="text-body-2 text-medium-emphasis mb-1">
            Humidity: {{ humidity }}%
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Wind: {{ windSpeed }} km/h
          </div>
          <v-chip 
            :color="recommendationColor" 
            size="small" 
            class="mt-2"
            variant="tonal"
          >
            {{ recommendation }}
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  temperature: {
    type: Number,
    default: 22
  },
  condition: {
    type: String,
    default: 'Sunny'
  },
  location: {
    type: String,
    default: 'Your Location'
  },
  humidity: {
    type: Number,
    default: 65
  },
  windSpeed: {
    type: Number,
    default: 8
  }
})

const weatherIcon = computed(() => {
  const condition = props.condition.toLowerCase()
  if (condition.includes('sunny') || condition.includes('clear')) return 'mdi-weather-sunny'
  if (condition.includes('cloud')) return 'mdi-weather-cloudy'
  if (condition.includes('rain')) return 'mdi-weather-rainy'
  if (condition.includes('snow')) return 'mdi-weather-snowy'
  return 'mdi-weather-partly-cloudy'
})

const iconColor = computed(() => {
  const condition = props.condition.toLowerCase()
  if (condition.includes('sunny')) return 'orange'
  if (condition.includes('rain')) return 'blue'
  if (condition.includes('snow')) return 'light-blue'
  return 'grey'
})

const recommendation = computed(() => {
  if (props.temperature > 25) return 'Water more'
  if (props.temperature < 15) return 'Water less'
  return 'Normal watering'
})

const recommendationColor = computed(() => {
  if (props.temperature > 25) return 'warning'
  if (props.temperature < 15) return 'info'
  return 'success'
})
</script>

<style scoped>
.weather-widget {
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.weather-icon {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 8px;
  backdrop-filter: blur(10px);
}

@media (max-width: 600px) {
  .weather-widget .text-right {
    display: none;
  }
}
</style>