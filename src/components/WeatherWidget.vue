<template>
  <div class="weather-widget">
    <!-- Loading State -->
    <div v-if="loading" class="weather-loading">
      <div class="skeleton skeleton-temp"></div>
      <div class="skeleton skeleton-desc"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="weather-error">
      <v-icon size="24" color="warning" class="mr-2">mdi-weather-cloudy-alert</v-icon>
      <span>Weather unavailable</span>
      <v-btn
        @click="$emit('retry')"
        variant="text"
        size="small"
        icon="mdi-refresh"
        class="ml-auto"
      />
    </div>

    <!-- Weather Data -->
    <div v-else class="weather-content">
      <!-- Main Weather -->
      <div class="weather-main">
        <div class="weather-icon-wrapper">
          <v-icon :icon="weatherIcon" :color="iconColor" size="40"></v-icon>
        </div>
        <div class="weather-info">
          <div class="weather-location" v-if="weatherData?.location">
            {{ weatherData.location }}
          </div>
          <div class="weather-temp">{{ displayTemperature }}{{ tempUnit }}</div>
          <div class="weather-desc">
            {{ weatherData?.description || weatherData?.condition || 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="weather-stats">
        <div class="stat">
          <v-icon size="16" color="primary">mdi-water-percent</v-icon>
          <span>{{ weatherData?.humidity || '--' }}%</span>
        </div>
        <div class="stat">
          <v-icon size="16" color="primary">mdi-weather-windy</v-icon>
          <span>{{ weatherData?.windSpeed || '--' }} km/h</span>
        </div>
      </div>

      <!-- Recommendation Chip -->
      <v-chip
        v-if="recommendation"
        :color="recommendation.color"
        :prepend-icon="recommendation.icon"
        size="small"
        variant="tonal"
        class="recommendation-chip"
      >
        {{ recommendation.message }}
      </v-chip>
    </div>
  </div>
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
  temperatureUnit: {
    type: String,
    default: 'celsius',
  },
})

defineEmits(['retry'])

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius) => {
  return Math.round((celsius * 9) / 5 + 32)
}

// Display temperature with correct unit
const displayTemperature = computed(() => {
  if (!props.weatherData?.temperature) return '--'
  const temp = props.weatherData.temperature
  if (props.temperatureUnit === 'fahrenheit') {
    return celsiusToFahrenheit(temp)
  }
  return temp
})

// Temperature unit symbol
const tempUnit = computed(() => {
  return props.temperatureUnit === 'fahrenheit' ? '°F' : '°C'
})

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
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 20px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.weather-widget::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.08) 0%, transparent 70%);
  pointer-events: none;
}

/* Loading State */
.weather-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.skeleton-temp {
  width: 80px;
  height: 32px;
}

.skeleton-desc {
  width: 120px;
  height: 16px;
}

/* Error State */
.weather-error {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.9rem;
}

/* Weather Content */
.weather-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 150px;
}

.weather-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.weather-info {
  flex: 1;
}

.weather-location {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.weather-temp {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1;
}

.weather-desc {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: capitalize;
  margin-top: 4px;
}

/* Stats */
.weather-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  background: rgba(var(--v-theme-primary), 0.06);
  padding: 6px 12px;
  border-radius: 20px;
}

/* Recommendation */
.recommendation-chip {
  margin-left: auto;
}

@media (max-width: 600px) {
  .weather-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-stats {
    width: 100%;
    justify-content: flex-start;
  }

  .recommendation-chip {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
