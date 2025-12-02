<template>
  <v-card class="calendar-widget" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-calendar</v-icon>
        This Week
      </div>
      <v-btn 
        @click="goToToday" 
        size="small" 
        variant="text" 
        color="primary"
      >
        Today
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Week Navigation -->
      <div class="d-flex align-center justify-space-between mb-3">
        <v-btn 
          @click="previousWeek" 
          icon="mdi-chevron-left" 
          size="small" 
          variant="text"
        />
        <div class="text-subtitle-1 font-weight-medium">
          {{ weekRange }}
        </div>
        <v-btn 
          @click="nextWeek" 
          icon="mdi-chevron-right" 
          size="small" 
          variant="text"
        />
      </div>

      <!-- Calendar Days -->
      <div class="calendar-days">
        <div
          v-for="day in weekDays"
          :key="day.dateString"
          class="calendar-day"
          :class="{ 
            'calendar-day--today': day.isToday,
            'calendar-day--selected': day.isSelected,
            'calendar-day--has-plants': day.plantCount > 0
          }"
          @click="selectDay(day)"
        >
          <!-- Day Name -->
          <div class="day-name">{{ day.dayName }}</div>
          
          <!-- Day Number -->
          <div class="day-number">{{ day.dayNumber }}</div>
          
          <!-- Plant Indicators -->
          <div class="plant-indicators">
            <v-chip
              v-if="day.plantCount > 0"
              :color="day.isToday ? 'primary' : 'success'"
              size="x-small"
              class="plant-count-chip"
            >
              {{ day.plantCount }}
            </v-chip>
            <v-icon
              v-else-if="day.isToday"
              size="16"
              color="primary"
            >
              mdi-circle-outline
            </v-icon>
          </div>
        </div>
      </div>

      <!-- Selected Day Info -->
      <div v-if="selectedDay" class="selected-day-info mt-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-2">
          {{ selectedDay.fullDate }}
        </div>
        <div v-if="selectedDay.plantCount > 0" class="text-body-2 text-medium-emphasis">
          {{ selectedDay.plantCount }} plant{{ selectedDay.plantCount > 1 ? 's' : '' }} need{{ selectedDay.plantCount === 1 ? 's' : '' }} attention
        </div>
        <div v-else class="text-body-2 text-medium-emphasis">
          No plants need attention today
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  plants: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['day-selected'])

// Reactive data
const currentWeekStart = ref(new Date())
const selectedDate = ref(new Date())
const plantCounts = ref(new Map()) // Store stable plant counts

// Helper function to get stable plant count for a date
const getPlantCount = (dateString) => {
  if (!plantCounts.value.has(dateString)) {
    // Generate stable count based on date string hash
    const hash = dateString.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const count = Math.abs(hash) % 4 // 0-3 plants per day
    plantCounts.value.set(dateString, count)
  }
  return plantCounts.value.get(dateString)
}

// Computed properties
const weekDays = computed(() => {
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(currentWeekStart.value.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    
    days.push({
      date: date,
      dateString: dateString,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isToday: date.toDateString() === today.toDateString(),
      isSelected: date.toDateString() === selectedDate.value.toDateString(),
      plantCount: getPlantCount(dateString)
    })
  }
  
  return days
})

const weekRange = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(currentWeekStart.value)
  end.setDate(start.getDate() + 6)
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`
  } else {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
  }
})

const selectedDay = computed(() => {
  return weekDays.value.find(day => day.isSelected)
})

// Methods
const goToToday = () => {
  const today = new Date()
  setWeekStart(today)
  selectedDate.value = today
}

const previousWeek = () => {
  const newStart = new Date(currentWeekStart.value)
  newStart.setDate(newStart.getDate() - 7)
  currentWeekStart.value = newStart
}

const nextWeek = () => {
  const newStart = new Date(currentWeekStart.value)
  newStart.setDate(newStart.getDate() + 7)
  currentWeekStart.value = newStart
}

const selectDay = (day) => {
  selectedDate.value = new Date(day.date)
  emit('day-selected', day)
}

const setWeekStart = (date) => {
  const dayOfWeek = date.getDay() // 0 = Sunday
  const start = new Date(date)
  start.setDate(date.getDate() - dayOfWeek)
  currentWeekStart.value = start
}

// Initialize
onMounted(() => {
  goToToday()
})
</script>

<style scoped>
.calendar-widget {
  border-radius: 16px !important;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
  position: relative;
}

.calendar-day:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* Today - Blue border with light background */
.calendar-day--today {
  background-color: rgba(33, 150, 243, 0.1);
  border: 2px solid #2196F3;
  color: #1976D2;
}

/* Selected - Green background with darker border */
.calendar-day--selected {
  background-color: rgba(76, 175, 80, 0.2);
  border: 2px solid #4CAF50;
  color: #2E7D32;
}

/* Today + Selected - Purple combination */
.calendar-day--today.calendar-day--selected {
  background-color: rgba(156, 39, 176, 0.2);
  border: 2px solid #9C27B0;
  color: #7B1FA2;
}

.calendar-day--has-plants {
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

/* Override plant border when today or selected */
.calendar-day--today.calendar-day--has-plants {
  border: 2px solid #2196F3;
}

.calendar-day--selected.calendar-day--has-plants {
  border: 2px solid #4CAF50;
}

.calendar-day--today.calendar-day--selected.calendar-day--has-plants {
  border: 2px solid #9C27B0;
}

.day-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 4px;
}

.day-number {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.plant-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
}

.plant-count-chip {
  font-size: 0.7rem !important;
  height: 18px !important;
}

.selected-day-info {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 12px;
}

@media (max-width: 600px) {
  .calendar-day {
    padding: 8px 4px;
    min-height: 70px;
  }
  
  .day-number {
    font-size: 1rem;
  }
  
  .calendar-days {
    gap: 4px;
  }
}
</style>