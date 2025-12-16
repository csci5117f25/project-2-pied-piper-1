<template>
  <v-container fluid class="rewards-container">
    <!-- Modern Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <v-icon size="24" color="warning">mdi-trophy</v-icon>
        </div>
        <div>
          <h1 class="page-title">Rewards & Achievements</h1>
          <p class="page-subtitle">Track your plant care journey and unlock achievements</p>
        </div>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--primary">
          <v-icon size="28" color="primary">mdi-leaf</v-icon>
        </div>
        <div class="stat-value">{{ userStats.totalPlants }}</div>
        <div class="stat-label">Total Plants</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--success">
          <v-icon size="28" color="success">mdi-water</v-icon>
        </div>
        <div class="stat-value">{{ userStats.wateringStreak }}</div>
        <div class="stat-label">Day Streak</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--warning">
          <v-icon size="28" color="warning">mdi-star</v-icon>
        </div>
        <div class="stat-value">{{ userStats.achievementsUnlocked }}</div>
        <div class="stat-label">Achievements</div>
      </div>
    </div>

    <!-- Current Level Progress -->
    <div class="level-card">
      <div class="level-header">
        <div class="level-avatar">
          <v-icon size="32" color="white">{{ currentLevel.icon }}</v-icon>
        </div>
        <div class="level-info">
          <h3 class="level-name">{{ currentLevel.name }}</h3>
          <p class="level-desc">{{ currentLevel.description }}</p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="level-progress">
        <div class="progress-header">
          <span>Level {{ currentLevel.level }}</span>
          <span v-if="!levelProgress.isMaxLevel">
            {{ levelProgress.xpInCurrentLevel }} / {{ levelProgress.xpNeededForNext }} XP
          </span>
          <span v-else>Max Level Reached!</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${levelProgress.progress}%` }"></div>
        </div>
        <p class="next-level-hint" v-if="!levelProgress.isMaxLevel">
          Next: {{ nextLevel.name }} ({{ levelProgress.xpToNextLevel }} XP needed)
        </p>
        <p class="next-level-hint" v-else>
          You've reached the highest level! Keep caring for your plants!
        </p>
      </div>

      <!-- Today's Task XP -->
      <div class="today-xp" v-if="todayTasksXP > 0">
        <v-icon color="warning" size="20">mdi-star</v-icon>
        <span>+{{ todayTasksXP }} XP earned from tasks today</span>
      </div>
    </div>

    <!-- Achievements Section -->
    <div class="section-header">
      <v-icon size="22" color="warning">mdi-medal</v-icon>
      <h2>Achievements</h2>
    </div>

    <div class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        :class="['achievement-card', { 'achievement-card--unlocked': achievement.unlocked }]"
        @click="openAchievementDetail(achievement)"
      >
        <!-- Achievement Icon -->
        <div class="achievement-icon-wrapper">
          <div
            :class="['achievement-icon', { locked: !achievement.unlocked }]"
            :style="
              achievement.unlocked
                ? { backgroundColor: `rgb(var(--v-theme-${achievement.color}))` }
                : {}
            "
          >
            <v-icon
              size="28"
              :color="achievement.unlocked ? 'white' : undefined"
              :class="{ 'text-medium-emphasis': !achievement.unlocked }"
            >
              {{ achievement.icon }}
            </v-icon>
          </div>
          <div v-if="!achievement.unlocked" class="lock-badge">
            <v-icon size="12" color="grey-darken-1">mdi-lock</v-icon>
          </div>
        </div>

        <!-- Achievement Info -->
        <h4 class="achievement-name">{{ achievement.name }}</h4>
        <p class="achievement-desc">{{ achievement.description }}</p>

        <!-- Progress or Status -->
        <div class="achievement-status">
          <template v-if="!achievement.unlocked">
            <div class="mini-progress-bar">
              <div
                class="mini-progress-fill"
                :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ achievement.progress }} / {{ achievement.target }}</span>
          </template>
          <template v-else>
            <div class="unlocked-badge">
              <v-icon size="14">mdi-check-circle</v-icon>
              <span>{{ formatDate(achievement.unlockedDate) }}</span>
            </div>
          </template>
        </div>

        <!-- XP Reward -->
        <div :class="['xp-badge', { active: achievement.unlocked }]">
          +{{ achievement.xpReward }} XP
        </div>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="section-header">
      <v-icon size="22">mdi-history</v-icon>
      <h2>Recent Activities</h2>
    </div>

    <div class="activities-card">
      <div v-if="recentActivities.length === 0" class="empty-activities">
        <div class="empty-icon">📋</div>
        <p>No recent activities yet</p>
      </div>

      <div v-else class="activities-list">
        <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
          <div :class="['activity-icon', `activity-icon--${activity.color}`]">
            <v-icon size="20" color="white">{{ activity.icon }}</v-icon>
          </div>
          <div class="activity-content">
            <h4>{{ activity.title }}</h4>
            <p>{{ activity.description }}</p>
          </div>
          <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Achievement Detail Dialog -->
    <AchievementDetailDialog v-model="showAchievementDetail" :achievement="selectedAchievement" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AchievementDetailDialog from '@/components/AchievementDetailDialog.vue'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'
import {
  checkDailyAchievementReset,
  syncAllAchievements,
  LEVEL_THRESHOLDS,
  getLevelProgress,
} from '@/utils/achievements'

// User stats
const userStats = ref({
  totalPlants: 0,
  wateringStreak: 0,
  achievementsUnlocked: 0,
  currentXP: 0,
  totalXP: 0,
})

// User XP from database
const userXP = ref(0)
const userLevel = ref(1)
const todayTasksXP = ref(0)

// Achievement detail dialog
const showAchievementDetail = ref(false)
const selectedAchievement = ref(null)

// Function to open achievement detail
const openAchievementDetail = (achievement) => {
  selectedAchievement.value = achievement
  showAchievementDetail.value = true
}

// Use imported level thresholds
const levels = LEVEL_THRESHOLDS

// Total XP now comes from user document (includes task XP)
const totalXP = computed(() => userXP.value)

const currentLevel = computed(() => {
  const levelInfo = levels.find((l) => l.level === userLevel.value)
  return levelInfo || levels[0]
  for (const l of levels) {
    if (totalXP.value >= l.xpRequired) {
      level = l
    } else {
      break
    }
  }
  return level
})

const nextLevel = computed(() => {
  const currentIndex = levels.findIndex((l) => l.level === currentLevel.value.level)
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel.value
})

// Calculate level progress using utility function
const levelProgress = computed(() => getLevelProgress(totalXP.value))

// Achievements
const achievements = ref([
  {
    id: 'first-plant',
    name: 'First Plant',
    description: 'Add your first plant to the collection',
    icon: 'mdi-sprout-outline',
    color: 'success',
    xpReward: 10,
    target: 1,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
  {
    id: 'water-warrior',
    name: 'Water Warrior',
    description: 'Water plants 5 days in a row',
    icon: 'mdi-water',
    color: 'primary',
    xpReward: 25,
    target: 5,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
  {
    id: 'plant-collector',
    name: 'Plant Collector',
    description: 'Add 5 plants to your collection',
    icon: 'mdi-leaf-circle',
    color: 'warning',
    xpReward: 50,
    target: 5,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
  {
    id: 'green-thumb',
    name: 'Green Thumb',
    description: 'Keep all plants healthy for 30 days',
    icon: 'mdi-thumb-up',
    color: 'success',
    xpReward: 100,
    target: 30,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
  {
    id: 'plant-photographer',
    name: 'Plant Photographer',
    description: 'Take photos of 10 different plants',
    icon: 'mdi-camera',
    color: 'purple',
    xpReward: 30,
    target: 10,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
  {
    id: 'consistent-caretaker',
    name: 'Consistent Caretaker',
    description: 'Log plant care for 7 days straight',
    icon: 'mdi-calendar-check',
    color: 'indigo',
    xpReward: 75,
    target: 7,
    progress: 0,
    unlocked: false,
    unlockedDate: null,
  },
])

// Recent activities
const recentActivities = ref([])

// Utility functions
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatTime = (date) => {
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

// Initialize data
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Load user XP and level
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        userXP.value = userData.xp || 0
        userLevel.value = userData.level || 1

        // Calculate today's task XP
        const tasksToday = userData.tasksCompletedToday || []
        // Count non-bonus tasks (bonus tasks end with '_bonus')
        const taskCount = tasksToday.filter((t) => !t.endsWith('_bonus')).length
        todayTasksXP.value = taskCount * 30 // Approximate XP per task
      }

      // First, sync all achievements to ensure accurate progress
      await syncAllAchievements(user.uid)

      // Then check daily reset and load activities
      await Promise.all([checkDailyAchievementReset(user.uid), loadRecentActivities(user.uid)])

      // Set up real-time listeners for live updates
      setupRealtimeListeners(user.uid)
    }
  })
})

// Clean up listeners on unmount
onUnmounted(() => {
  if (unsubscribePlants) unsubscribePlants()
  if (unsubscribeAchievements) unsubscribeAchievements()
})

// Helper to parse Firestore Timestamp or ISO string
const parseUnlockedDate = (val) => {
  if (!val) return null
  if (val.toDate) return val.toDate()
  if (typeof val === 'string') return new Date(val)
  try {
    return new Date(val)
  } catch {
    return null
  }
}

// Store unsubscribe functions
let unsubscribePlants = null
let unsubscribeAchievements = null

// Process achievements snapshot data
const processAchievementsSnapshot = (achievementsSnap) => {
  const unlockedCount = achievementsSnap.docs.filter((doc) => doc.data().unlocked).length

  // Calculate watering streak from Water Warrior achievement
  let wateringStreak = 0
  const waterWarriorDoc = achievementsSnap.docs.find((doc) => doc.id === 'water-warrior')
  if (waterWarriorDoc) {
    const waterWarriorData = waterWarriorDoc.data()
    const progress = waterWarriorData.progress || 0
    const lastCompletedDate = waterWarriorData.lastCompletedDate

    if (lastCompletedDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastDate = new Date(lastCompletedDate)
      lastDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 0 || daysDiff === 1) {
        wateringStreak = progress
      } else {
        wateringStreak = 0
      }
    } else {
      wateringStreak = progress
    }
  }

  // Update achievements list (needed for XP calculation)
  achievementsSnap.forEach((doc) => {
    const achievementData = doc.data()
    const achievement = achievements.value.find(
      (a) => a.id === doc.id || a.id === achievementData.id,
    )

    if (achievement) {
      achievement.progress =
        typeof achievementData.progress === 'number'
          ? achievementData.progress
          : achievementData.progress || 0
      achievement.unlocked = !!achievementData.unlocked
      achievement.unlockedDate = parseUnlockedDate(achievementData.unlockedDate)
      if (achievementData.xpReward !== undefined) {
        achievement.xpReward = achievementData.xpReward
      }
    } else {
      achievements.value.push({
        id: doc.id,
        name: achievementData.name || doc.id,
        description: achievementData.description || '',
        icon: achievementData.icon || 'mdi-trophy',
        color: achievementData.color || 'grey',
        xpReward: achievementData.xpReward || 0,
        target: achievementData.target || achievementData.goal || 1,
        progress:
          typeof achievementData.progress === 'number'
            ? achievementData.progress
            : achievementData.progress || 0,
        unlocked: !!achievementData.unlocked,
        unlockedDate: parseUnlockedDate(achievementData.unlockedDate),
      })
    }
  })

  return { unlockedCount, wateringStreak }
}

// Set up real-time listeners for user stats and achievements
const setupRealtimeListeners = (userId) => {
  try {
    // Listen to plants collection for real-time count
    const plantsQuery = query(collection(db, 'plants'), where('userId', '==', userId))
    unsubscribePlants = onSnapshot(plantsQuery, (snapshot) => {
      userStats.value.totalPlants = snapshot.size
    })

    // Listen to achievements for real-time updates
    const achievementsRef = collection(db, 'users', userId, 'achievements')
    unsubscribeAchievements = onSnapshot(achievementsRef, (snapshot) => {
      const { unlockedCount, wateringStreak } = processAchievementsSnapshot(snapshot)
      userStats.value.achievementsUnlocked = unlockedCount
      userStats.value.wateringStreak = wateringStreak
    })
  } catch (error) {
    console.error('Error setting up real-time listeners:', error)
  }
}

// Activity type mappings
const getActivityStyle = (type) => {
  const styles = {
    plant_added: { icon: 'mdi-plus-circle', color: 'success' },
    plant_watered: { icon: 'mdi-water', color: 'primary' },
    achievement_unlocked: { icon: 'mdi-trophy', color: 'warning' },
    plant_photo: { icon: 'mdi-camera', color: 'purple' },
    plant_deleted: { icon: 'mdi-delete', color: 'error' },
  }
  return styles[type] || { icon: 'mdi-circle', color: 'grey' }
}

// Load recent activities from Firestore
const loadRecentActivities = async (userId) => {
  try {
    const activitiesRef = collection(db, 'users', userId, 'activities')
    const activitiesQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(10))
    const activitiesSnap = await getDocs(activitiesQuery)

    console.log('Activities found:', activitiesSnap.size)

    recentActivities.value = activitiesSnap.docs.map((doc) => {
      const data = doc.data()
      console.log('Activity data:', data)
      const style = getActivityStyle(data.type)
      return {
        title: data.title,
        description: data.description,
        icon: style.icon,
        color: style.color,
        timestamp: data.timestamp?.toDate() || new Date(),
      }
    })
  } catch (error) {
    console.error('Error loading activities:', error)
  }
}
</script>

<style scoped>
.rewards-container {
  padding-top: 20px;
  padding-bottom: 100px;
}

/* Page Header */
.page-header {
  margin-bottom: 28px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-warning), 0.12);
  border-radius: var(--radius-lg, 12px);
}

.page-title {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.75rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.95);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 24px 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg, 12px);
}

.stat-icon--primary {
  background: rgba(var(--v-theme-primary), 0.12);
}
.stat-icon--success {
  background: rgba(var(--v-theme-success), 0.12);
}
.stat-icon--warning {
  background: rgba(var(--v-theme-warning), 0.12);
}

.stat-value {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 2rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.9);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Level Card */
.level-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 24px;
  margin-bottom: 32px;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.level-avatar {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-success)));
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.3);
}

.level-name {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.level-desc {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 8px;
}

.progress-bar {
  height: 10px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-success)));
  border-radius: 10px;
  transition: width 0.5s ease;
}

.next-level-hint {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 12px 0 0 0;
}
.today-xp {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-warning), 0.1),
    rgba(var(--v-theme-warning), 0.05)
  );
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid rgba(var(--v-theme-warning), 0.2);
}

.today-xp span {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-warning));
}
/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.section-header h2 {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin: 0;
}

/* Achievements Grid */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.achievement-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 24px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.achievement-card--unlocked {
  border-color: rgba(var(--v-theme-success), 0.4);
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-success), 0.04) 0%,
    rgba(var(--v-theme-surface), 1) 100%
  );
}

.achievement-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.achievement-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.achievement-icon.locked {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.lock-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.achievement-name {
  font-family: var(--font-display, 'Manrope', sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin: 0 0 6px 0;
}

.achievement-desc {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0 0 16px 0;
  min-height: 40px;
}

.achievement-status {
  min-height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.mini-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.mini-progress-fill {
  height: 100%;
  background: rgb(var(--v-theme-primary));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.unlocked-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-success));
  font-weight: 600;
}

.xp-badge {
  display: inline-block;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.5);
  border-radius: 20px;
}

.xp-badge.active {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}

/* Activities Card */
.activities-card {
  background: rgba(var(--v-theme-surface), 1);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.empty-activities {
  padding: 48px 24px;
  text-align: center;
}

.empty-activities .empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-activities p {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}

.activities-list {
  padding: 8px 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.activity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 8px);
  flex-shrink: 0;
}

.activity-icon--success {
  background: rgb(var(--v-theme-success));
}
.activity-icon--primary {
  background: rgb(var(--v-theme-primary));
}
.activity-icon--warning {
  background: rgb(var(--v-theme-warning));
}
.activity-icon--purple {
  background: #9c27b0;
}
.activity-icon--error {
  background: rgb(var(--v-theme-error));
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-content h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
  margin: 0 0 2px 0;
}

.activity-content p {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.4);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    text-align: left;
    gap: 16px;
  }

  .stat-icon {
    margin: 0;
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .rewards-container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .level-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
