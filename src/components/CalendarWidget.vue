<template>
  <div class="calendar-widget">
    <!-- Header -->
    <div class="calendar-header">
      <div class="header-left">
        <v-icon class="header-icon" color="primary">mdi-calendar-month</v-icon>
        <span class="header-title">{{ viewMode === 'week' ? 'This Week' : 'This Month' }}</span>
      </div>
      <div class="header-controls">
        <div class="view-toggle">
          <button
            :class="['toggle-btn', { active: viewMode === 'week' }]"
            @click="viewMode = 'week'"
          >
            Week
          </button>
          <button
            :class="['toggle-btn', { active: viewMode === 'month' }]"
            @click="viewMode = 'month'"
          >
            Month
          </button>
        </div>
        <button class="today-btn" @click="goToToday">Today</button>
      </div>
    </div>

    <!-- Navigation -->
    <div class="calendar-nav">
      <button class="nav-btn" @click="viewMode === 'week' ? previousWeek() : previousMonth()">
        <v-icon size="20">mdi-chevron-left</v-icon>
      </button>
      <span class="nav-label">{{ viewMode === 'week' ? weekRange : monthRange }}</span>
      <button class="nav-btn" @click="viewMode === 'week' ? nextWeek() : nextMonth()">
        <v-icon size="20">mdi-chevron-right</v-icon>
      </button>
    </div>

    <!-- Week View -->
    <div v-if="viewMode === 'week'" class="week-grid">
      <div
        v-for="day in weekDays"
        :key="day.dateString"
        class="week-day"
        :class="{
          'week-day--today': day.isToday,
          'week-day--selected': day.isSelected,
          'week-day--has-tasks': day.totalTasks > 0,
        }"
        @click="selectDay(day)"
      >
        <span class="week-day-name">{{ day.dayName }}</span>
        <span class="week-day-number">{{ day.dayNumber }}</span>
        <!-- Task indicators -->
        <div v-if="day.totalTasks > 0" class="task-indicators">
          <span
            v-if="day.waterCount > 0"
            class="task-dot task-dot--water"
            :title="`${day.waterCount} to water`"
          ></span>
          <span
            v-if="day.fertilizerCount > 0"
            class="task-dot task-dot--fertilizer"
            :title="`${day.fertilizerCount} to fertilize`"
          ></span>
          <span
            v-if="day.maintenanceCount > 0"
            class="task-dot task-dot--maintenance"
            :title="`${day.maintenanceCount} maintenance`"
          ></span>
        </div>
      </div>
    </div>

    <!-- Month View -->
    <div v-else class="month-grid">
      <!-- Day Headers -->
      <div class="month-header-row">
        <div v-for="dayName in dayHeaders" :key="dayName" class="month-header-cell">
          {{ dayName }}
        </div>
      </div>

      <!-- Month Days -->
      <div class="month-days-grid">
        <div
          v-for="day in monthDays"
          :key="day.dateString"
          class="month-day"
          :class="{
            'month-day--today': day.isToday,
            'month-day--selected': day.isSelected,
            'month-day--has-tasks': day.totalTasks > 0,
            'month-day--other': day.isOtherMonth,
          }"
          @click="selectDay(day)"
        >
          <span class="month-day-num">{{ day.dayNumber }}</span>
          <!-- Task indicators -->
          <div v-if="day.totalTasks > 0" class="task-indicators-month">
            <span v-if="day.waterCount > 0" class="task-dot-sm task-dot--water"></span>
            <span v-if="day.fertilizerCount > 0" class="task-dot-sm task-dot--fertilizer"></span>
            <span v-if="day.maintenanceCount > 0" class="task-dot-sm task-dot--maintenance"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  plants: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['day-selected'])

// Reactive data
const viewMode = ref('week')
const currentWeekStart = ref(new Date())
const currentMonth = ref(new Date())
const selectedDate = ref(new Date())

// Helper function to check if a plant needs watering on a specific date
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

// Helper function to get plant count for a date
const getPlantCount = (date) => {
  if (!props.plants || props.plants.length === 0) {
    return 0
  }

  return props.plants.filter((plant) => needsWateringOnDate(plant, date)).length
}

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

  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Only show on today or past dates that are due
  if (target > today) return false

  if (!plant.lastFertilized) return true // Never fertilized, due now

  const lastDate = plant.lastFertilized.toDate
    ? plant.lastFertilized.toDate()
    : new Date(plant.lastFertilized)
  lastDate.setHours(0, 0, 0, 0)

  const daysSince = Math.floor((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince >= weeks * 7
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

  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Only show on today or past dates that are due
  if (target > today) return false

  if (!plant.lastMaintenance) return true // Never maintained, due now

  const lastDate = plant.lastMaintenance.toDate
    ? plant.lastMaintenance.toDate()
    : new Date(plant.lastMaintenance)
  lastDate.setHours(0, 0, 0, 0)

  const daysSince = Math.floor((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince >= weeks * 7
}

// Get fertilizer count for a date
const getFertilizerCount = (date) => {
  if (!props.plants || props.plants.length === 0) return 0
  return props.plants.filter((plant) => needsFertilizingOnDate(plant, date)).length
}

// Get maintenance count for a date
const getMaintenanceCount = (date) => {
  if (!props.plants || props.plants.length === 0) return 0
  return props.plants.filter((plant) => needsMaintenanceOnDate(plant, date)).length
}

// Get all task counts for a date
const getTaskCounts = (date) => {
  const waterCount = getPlantCount(date)
  const fertilizerCount = getFertilizerCount(date)
  const maintenanceCount = getMaintenanceCount(date)

  // Count unique plants that need any task (to avoid counting same plant multiple times)
  const uniquePlants = new Set()
  if (props.plants && props.plants.length > 0) {
    props.plants.forEach((plant) => {
      if (
        needsWateringOnDate(plant, date) ||
        needsFertilizingOnDate(plant, date) ||
        needsMaintenanceOnDate(plant, date)
      ) {
        uniquePlants.add(plant.id)
      }
    })
  }

  return {
    waterCount,
    fertilizerCount,
    maintenanceCount,
    totalTasks: uniquePlants.size,
  }
}

// Computed properties
const weekDays = computed(() => {
  const days = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(currentWeekStart.value.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    const taskCounts = getTaskCounts(date)

    days.push({
      date: date,
      dateString: dateString,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isToday: date.toDateString() === today.toDateString(),
      isSelected: date.toDateString() === selectedDate.value.toDateString(),
      ...taskCounts,
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
    year: 'numeric',
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
    const taskCounts = getTaskCounts(date)

    days.push({
      date: date,
      dateString: dateString,
      dayNumber: date.getDate(),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isToday: date.toDateString() === today.toDateString(),
      isSelected: date.toDateString() === selectedDate.value.toDateString(),
      isOtherMonth: date.getMonth() !== currentMonth.value.getMonth(),
      ...taskCounts,
    })
  }

  return days
})

// Methods
const goToToday = () => {
  const today = new Date()
  setWeekStart(today)
  setMonthStart(today)
  selectedDate.value = today

  // Switch to weekly view when clicking Today
  viewMode.value = 'week'

  // Emit day-selected event with today's day info
  const todayString = today.toISOString().split('T')[0]
  const taskCounts = getTaskCounts(today)
  const dayInfo = {
    date: today,
    dateString: todayString,
    fullDate: today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    isToday: true,
    ...taskCounts,
  }
  emit('day-selected', dayInfo)
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
/* Modern Calendar Widget Styles */
.calendar-widget {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Header */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.header-title {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.125rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--radius-lg, 12px);
  padding: 4px;
}

.toggle-btn {
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.toggle-btn.active {
  background: rgba(var(--v-theme-primary), 1);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

.today-btn {
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  background: transparent;
  color: rgb(var(--v-theme-primary));
  border-radius: var(--radius-lg, 12px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* Navigation */
.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.7);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.nav-label {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* Week View */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  border-radius: var(--radius-lg, 12px);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 85px;
  position: relative;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 2px solid transparent;
  box-sizing: border-box;
}

.week-day:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-2px);
}

/* Week Day States */
.week-day--today {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.15),
    rgba(var(--v-theme-primary), 0.08)
  );
  border-color: rgb(var(--v-theme-primary));
}

.week-day--selected {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-success), 0.2),
    rgba(var(--v-theme-success), 0.1)
  );
  border-color: rgb(var(--v-theme-success));
}

.week-day--today.week-day--selected {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1));
  border-color: #7c3aed;
}

.week-day--has-plants {
  border-color: rgba(var(--v-theme-success), 0.4);
}

.week-day--today.week-day--has-plants {
  border-color: rgb(var(--v-theme-primary));
}

.week-day--selected.week-day--has-plants {
  border-color: rgb(var(--v-theme-success));
}

.week-day-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 6px;
}

.week-day-number {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin-bottom: 8px;
}

.week-day-badge {
  position: absolute;
  bottom: 8px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgb(var(--v-theme-success));
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}

/* Month View */
.month-grid {
  width: 100%;
}

.month-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.month-header-cell {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 4px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.month-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.month-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 2px solid transparent;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: var(--radius-md, 8px);
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 42px;
}

.month-day:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.05);
}

.month-day--today {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.15),
    rgba(var(--v-theme-primary), 0.08)
  );
  border-color: rgb(var(--v-theme-primary));
}

.month-day--selected {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-success), 0.2),
    rgba(var(--v-theme-success), 0.1)
  );
  border-color: rgb(var(--v-theme-success));
}

.month-day--today.month-day--selected {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1));
  border-color: #7c3aed;
}

.month-day--other {
  opacity: 0.35;
}

.month-day--has-tasks {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.month-day--today.month-day--has-tasks {
  border-color: rgb(var(--v-theme-primary));
}

.month-day--selected.month-day--has-tasks {
  border-color: rgb(var(--v-theme-success));
}

.month-day-num {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* Task Indicators - Week View */
.task-indicators {
  display: flex;
  gap: 4px;
  position: absolute;
  bottom: 8px;
}

.task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-dot--water {
  background: #3b82f6; /* Blue */
}

.task-dot--fertilizer {
  background: #22c55e; /* Green */
}

.task-dot--maintenance {
  background: #f59e0b; /* Amber/Yellow */
}

/* Task Indicators - Month View */
.task-indicators-month {
  display: flex;
  gap: 2px;
  position: absolute;
  bottom: 2px;
}

.task-dot-sm {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.task-dot-sm.task-dot--water {
  background: #3b82f6;
}

.task-dot-sm.task-dot--fertilizer {
  background: #22c55e;
}

.task-dot-sm.task-dot--maintenance {
  background: #f59e0b;
}

/* Week day has tasks */
.week-day--has-tasks {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.week-day--today.week-day--has-tasks {
  border-color: rgb(var(--v-theme-primary));
}

.week-day--selected.week-day--has-tasks {
  border-color: rgb(var(--v-theme-success));
}

.month-day-badge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  font-size: 0.5625rem;
  font-weight: 700;
  background: rgb(var(--v-theme-success));
  color: white;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

/* Responsive */
@media (max-width: 600px) {
  .calendar-widget {
    padding: 16px;
  }

  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }

  .week-day {
    padding: 10px 4px;
    min-height: 75px;
  }

  .week-day-name {
    font-size: 0.625rem;
  }

  .week-day-number {
    font-size: 1rem;
  }

  .week-grid {
    gap: 4px;
  }

  .month-day {
    min-height: 36px;
  }

  .month-day-num {
    font-size: 0.75rem;
  }

  .month-day-badge {
    width: 14px;
    height: 14px;
    font-size: 0.5rem;
  }

  .toggle-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .today-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
}
</style>
