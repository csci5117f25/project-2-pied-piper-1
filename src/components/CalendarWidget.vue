<template>
  <v-card class="calendar-widget" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-calendar</v-icon>
        {{ viewMode === 'week' ? 'This Week' : 'This Month' }}
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn-toggle 
          v-model="viewMode" 
          mandatory 
          density="compact"
          class="mr-2"
        >
          <v-btn value="week" size="small">Week</v-btn>
          <v-btn value="month" size="small">Month</v-btn>
        </v-btn-toggle>
        <v-btn 
          @click="goToToday" 
          size="small" 
          variant="text" 
          color="primary"
        >
          Today
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Navigation -->
      <div class="d-flex align-center justify-space-between mb-3">
        <v-btn 
          @click="viewMode === 'week' ? previousWeek() : previousMonth()" 
          icon="mdi-chevron-left" 
          size="small" 
          variant="text"
        />
        <div class="text-subtitle-1 font-weight-medium">
          {{ viewMode === 'week' ? weekRange : monthRange }}
        </div>
        <v-btn 
          @click="viewMode === 'week' ? nextWeek() : nextMonth()" 
          icon="mdi-chevron-right" 
          size="small" 
          variant="text"
        />
      </div>

      <!-- Week View -->
      <div v-if="viewMode === 'week'" class="calendar-days">
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
          <div class="day-name">{{ day.dayName }}</div>
          <div class="day-number">{{ day.dayNumber }}</div>
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

      <!-- Month View -->
      <div v-else class="month-calendar">
        <!-- Day Headers -->
        <div class="month-headers">
          <div v-for="dayName in dayHeaders" :key="dayName" class="month-header">
            {{ dayName }}
          </div>
        </div>
        
        <!-- Month Days -->
        <div class="month-days">
          <div
            v-for="day in monthDays"
            :key="day.dateString"
            class="month-day"
            :class="{ 
              'month-day--today': day.isToday,
              'month-day--selected': day.isSelected,
              'month-day--has-plants': day.plantCount > 0,
              'month-day--other-month': day.isOtherMonth
            }"
            @click="selectDay(day)"
          >
            <div class="month-day-number">{{ day.dayNumber }}</div>
            <div v-if="day.plantCount > 0" class="month-plant-indicator">
              <v-icon size="12" color="success">mdi-circle</v-icon>
            </div>
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

// Props (none currently used)

// Emits
const emit = defineEmits(['day-selected'])

// Reactive data
const viewMode = ref('week')
const currentWeekStart = ref(new Date())
const currentMonth = ref(new Date())
const selectedDate = ref(new Date())
const plantCounts = ref(new Map()) // Store stable plant counts

// Helper function to get plant count for a date (placeholder)
const getPlantCount = (date) => {
  // Generate stable fake data for demo purposes
  const dateString = date.toISOString().split('T')[0]
  if (!plantCounts.value.has(dateString)) {
    const hash = dateString.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const count = Math.abs(hash) % 4
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
      plantCount: getPlantCount(date)
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

const monthRange = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
})

const dayHeaders = computed(() => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
})

const monthDays = computed(() => {
  const days = []
  const today = new Date()
  const firstDay = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  
  // Start from the first Sunday of the calendar
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    
    days.push({
      date: date,
      dateString: dateString,
      dayNumber: date.getDate(),
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isToday: date.toDateString() === today.toDateString(),
      isSelected: date.toDateString() === selectedDate.value.toDateString(),
      isOtherMonth: date.getMonth() !== currentMonth.value.getMonth(),
      plantCount: getPlantCount(date)
    })
  }
  
  return days
})

const selectedDay = computed(() => {
  return weekDays.value.find(day => day.isSelected)
})

// Methods
const goToToday = () => {
  const today = new Date()
  setWeekStart(today)
  setMonthStart(today)
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

const previousMonth = () => {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() - 1)
  currentMonth.value = newMonth
}

const nextMonth = () => {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() + 1)
  currentMonth.value = newMonth
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

const setMonthStart = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  currentMonth.value = start
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
  border: 1px solid rgba(0, 0, 0, 0.1); /* Default light border for all days */
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

/* Month View Styles */
.month-calendar {
  width: 100%;
}

.month-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 8px;
}

.month-header {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 8px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.month-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.month-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 40px;
}

.month-day:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.month-day--today {
  background-color: rgba(33, 150, 243, 0.1);
  border: 2px solid #2196F3;
  color: #1976D2;
}

.month-day--selected {
  background-color: rgba(76, 175, 80, 0.2);
  border: 2px solid #4CAF50;
  color: #2E7D32;
}

.month-day--today.month-day--selected {
  background-color: rgba(156, 39, 176, 0.2);
  border: 2px solid #9C27B0;
  color: #7B1FA2;
}

.month-day--other-month {
  opacity: 0.3;
}

.month-day--has-plants {
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.month-day--today.month-day--has-plants {
  border: 2px solid #2196F3;
}

.month-day--selected.month-day--has-plants {
  border: 2px solid #4CAF50;
}

.month-day-number {
  font-size: 0.875rem;
  font-weight: 500;
}

.month-plant-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
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
  
  .month-day {
    min-height: 35px;
  }
  
  .month-day-number {
    font-size: 0.75rem;
  }
}
</style>