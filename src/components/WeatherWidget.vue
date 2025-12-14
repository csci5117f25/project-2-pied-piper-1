<template>
  <v-card class="weather-widget" elevation="3">
    <!-- Loading State -->
    <v-card-text v-if="loading" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" class="mb-2" />
      <div class="text-body-2 text-medium-emphasis">Loading weather...</div>
    </v-card-text>

    <!-- Error State -->
    <v-card-text v-else-if="error" class="pa-4">
      <v-alert type="warning" variant="tonal" density="compact" class="mb-0">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">Weather unavailable</div>
            <div class="text-caption">{{ error }}</div>
          </div>
          <v-btn @click="$emit('retry')" size="small" variant="text" icon="mdi-refresh" />
        </div>
      </v-alert>
    </v-card-text>

    <!-- Weather Data -->
    <v-card-text v-else class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <!-- Weather Info -->
        <div class="d-flex align-center">
          <div class="weather-icon mr-3">
            <v-icon :icon="weatherIcon" :color="iconColor" size="48"></v-icon>
          </div>
          <div>
            <div class="text-h5 font-weight-bold">{{ weatherData?.temperature || '--' }}°C</div>
            <div class="text-subtitle-1 text-medium-emphasis text-capitalize">
              {{ weatherData?.description || weatherData?.condition || 'N/A' }}
            </div>
            <div class="text-body-2 text-medium-emphasis d-flex align-center mt-1">
              <v-icon size="14" class="mr-1">mdi-map-marker</v-icon>
              {{ weatherData?.location || 'Unknown' }}
            </div>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="text-right hidden-xs">
          <div class="text-body-2 text-medium-emphasis mb-1">
            Humidity: {{ weatherData?.humidity || '--' }}%
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Wind: {{ weatherData?.windSpeed || '--' }} km/h
          </div>
          <v-tooltip v-if="recommendation" :text="recommendation.reason" location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-chip
                v-bind="tooltipProps"
                :color="recommendation.color"
                :prepend-icon="recommendation.icon"
                size="small"
                class="mt-2"
                variant="tonal"
              >
                {{ recommendation.message }}
              </v-chip>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Mobile Recommendation -->
      <div v-if="recommendation" class="mt-3 hidden-sm-and-up">
        <v-chip
          :color="recommendation.color"
          :prepend-icon="recommendation.icon"
          size="small"
          variant="tonal"
          block
        >
          {{ recommendation.message }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { getWeatherIcon } from '@/services/weatherService'

const props = defineProps({
  weatherData: {
    type: Object,
    default: null,
  },
  recommendation: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

defineEmits(['retry'])

const weatherIcon = computed(() => {
  if (!props.weatherData?.condition) return 'mdi-weather-partly-cloudy'
  return getWeatherIcon(props.weatherData.condition)
})

const iconColor = computed(() => {
  const condition = props.weatherData?.condition?.toLowerCase() || ''
  if (condition.includes('clear') || condition.includes('sunny')) return 'orange'
  if (condition.includes('rain')) return 'blue'
  if (condition.includes('snow')) return 'light-blue'
  if (condition.includes('cloud')) return 'grey'
  return 'grey'
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
