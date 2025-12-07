<template>
  <v-container fluid class="rewards-container">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">Rewards & Achievements</h1>
        <p class="text-body-1 text-medium-emphasis">
          Track your plant care journey and unlock achievements
        </p>
      </v-col>
    </v-row>

    <!-- Progress Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="stats-card" elevation="2">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="primary" class="mb-3"> mdi-sprout </v-icon>
            <div class="text-h3 font-weight-bold text-primary">
              {{ userStats.totalPlants }}
            </div>
            <div class="text-body-1 text-medium-emphasis">Total Plants</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="stats-card" elevation="2">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="success" class="mb-3"> mdi-water </v-icon>
            <div class="text-h3 font-weight-bold text-success">
              {{ userStats.wateringStreak }}
            </div>
            <div class="text-body-1 text-medium-emphasis">Day Streak</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="stats-card" elevation="2">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="warning" class="mb-3"> mdi-trophy </v-icon>
            <div class="text-h3 font-weight-bold text-warning">
              {{ userStats.achievementsUnlocked }}
            </div>
            <div class="text-body-1 text-medium-emphasis">Achievements</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Level Progress -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-4">
              <v-avatar size="64" color="primary" class="mr-4">
                <v-icon size="32" color="white">{{ currentLevel.icon }}</v-icon>
              </v-avatar>
              <div>
                <h3 class="text-h5 font-weight-bold">
                  {{ currentLevel.name }}
                </h3>
                <p class="text-body-1 text-medium-emphasis mb-0">
                  {{ currentLevel.description }}
                </p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>Level {{ currentLevel.level }}</span>
                <span>{{ totalXP }} / {{ currentLevel.xpRequired }} XP</span>
              </div>
              <v-progress-linear
                :model-value="(totalXP / currentLevel.xpRequired) * 100"
                height="8"
                color="primary"
                rounded
              />
            </div>

            <!-- Next Level Preview -->
            <div class="text-body-2 text-medium-emphasis">
              Next: {{ nextLevel.name }} ({{ Math.max(0, currentLevel.xpRequired - totalXP) }} XP
              needed)
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Achievements Grid -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-4">Achievements</h2>
      </v-col>

      <v-col v-for="achievement in achievements" :key="achievement.id" cols="12" sm="6" md="4">
        <v-card
          class="achievement-card"
          :class="{ 'achievement-card--unlocked': achievement.unlocked }"
          elevation="2"
        >
          <v-card-text class="text-center pa-4">
            <!-- Achievement Icon -->
            <div class="achievement-icon mb-3">
              <v-avatar
                size="64"
                :color="achievement.unlocked ? achievement.color : 'grey-lighten-2'"
              >
                <v-icon size="32" :color="achievement.unlocked ? 'white' : 'grey'">
                  {{ achievement.icon }}
                </v-icon>
              </v-avatar>

              <!-- Lock Overlay for locked achievements -->
              <v-icon v-if="!achievement.unlocked" class="lock-icon" color="grey" size="24">
                mdi-lock
              </v-icon>
            </div>

            <!-- Achievement Info -->
            <h4 class="text-subtitle-1 font-weight-bold mb-1">
              {{ achievement.name }}
            </h4>
            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ achievement.description }}
            </p>

            <!-- Progress -->
            <div v-if="!achievement.unlocked" class="mb-2 achievement-status-section">
              <v-progress-linear
                :model-value="(achievement.progress / achievement.target) * 100"
                height="4"
                color="primary"
                rounded
              />
              <div class="text-caption text-medium-emphasis mt-1">
                {{ achievement.progress }} / {{ achievement.target }}
              </div>
            </div>

            <!-- Unlocked Date -->
            <div v-else class="text-caption text-success mb-2 achievement-status-section achievement-status-section--unlocked">
              <v-icon size="16" class="mr-1">mdi-check-circle</v-icon>
              Unlocked {{ formatDate(achievement.unlockedDate) }}
            </div>

            <!-- XP Reward -->
            <v-chip size="small" :color="achievement.unlocked ? 'success' : 'grey'" class="mt-2">
              +{{ achievement.xpReward }} XP
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activities -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Recent Activities
          </v-card-title>

          <v-card-text class="pa-0">
            <div v-if="recentActivities.length === 0" class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4"> mdi-history </v-icon>
              <div class="text-body-1 text-medium-emphasis">No recent activities yet</div>
            </div>

            <v-list v-else>
              <v-list-item v-for="(activity, index) in recentActivities" :key="index">
                <template #prepend>
                  <v-avatar size="40" :color="activity.color">
                    <v-icon color="white">{{ activity.icon }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.description }}</v-list-item-subtitle>

                <template #append>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(activity.timestamp) }}
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { checkDailyAchievementReset } from '@/utils/achievements'

// User stats
const userStats = ref({
  totalPlants: 0,
  wateringStreak: 0,
  achievementsUnlocked: 0,
  currentXP: 0,
  totalXP: 0,
})

// Level system
const levels = [
  {
    level: 1,
    name: 'Seed Starter',
    description: 'Just beginning your plant journey',
    xpRequired: 100,
    icon: 'mdi-seed',
  },
  {
    level: 2,
    name: 'Green Thumb',
    description: 'Getting the hang of plant care',
    xpRequired: 250,
    icon: 'mdi-hand',
  },
  {
    level: 3,
    name: 'Plant Parent',
    description: 'Caring for multiple plants',
    xpRequired: 500,
    icon: 'mdi-sprout',
  },
  {
    level: 4,
    name: 'Garden Guardian',
    description: 'Master of plant care',
    xpRequired: 1000,
    icon: 'mdi-leaf',
  },
  {
    level: 5,
    name: 'Plant Whisperer',
    description: 'Expert plant caretaker',
    xpRequired: 2000,
    icon: 'mdi-flower',
  },
]

// Calculate total XP from all unlocked achievements
const totalXP = computed(() => {
  return achievements.value
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + (a.xpReward || 0), 0)
})

const currentLevel = computed(() => {
  let level = levels[0]
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
      // Run independent operations in parallel for faster loading
      await Promise.all([
        checkDailyAchievementReset(user.uid),
        loadUserStatsAndAchievements(user.uid),
        loadRecentActivities(user.uid)
      ])
    }
  })
})

// Helper to parse Firestore Timestamp or ISO string
const parseUnlockedDate = (val) => {
  if (!val) return null
  if (val.toDate) return val.toDate()
  if (typeof val === 'string') return new Date(val)
  try { return new Date(val) } catch { return null }
}

// Load user stats and achievements from Firestore (optimized - parallel queries)
const loadUserStatsAndAchievements = async (userId) => {
  try {
    // Run all independent queries in parallel
    const [plantsSnap, achievementsSnap] = await Promise.all([
      getDocs(query(collection(db, 'plants'), where('userId', '==', userId))),
      getDocs(collection(db, 'users', userId, 'achievements'))
    ])
    
    // Process achievements data once
    const unlockedCount = achievementsSnap.docs.filter(doc => doc.data().unlocked).length
    
    // Calculate watering streak from Water Warrior achievement
    let wateringStreak = 0
    const waterWarriorDoc = achievementsSnap.docs.find(doc => doc.id === 'water-warrior')
    if (waterWarriorDoc) {
      const waterWarriorData = waterWarriorDoc.data()
      const progress = waterWarriorData.progress || 0
      const lastCompletedDate = waterWarriorData.lastCompletedDate
      
      if (lastCompletedDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const lastDate = new Date(lastCompletedDate)
        lastDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 0 || daysDiff === 1) {
          wateringStreak = progress
        } else {
          wateringStreak = 0
        }
      } else {
        wateringStreak = progress
      }
    }
    
    // Update achievements list first (needed for XP calculation)
    achievementsSnap.forEach((doc) => {
      const achievementData = doc.data()
      const achievement = achievements.value.find(a => a.id === doc.id || a.id === achievementData.id)

      if (achievement) {
        achievement.progress = (typeof achievementData.progress === 'number') ? achievementData.progress : (achievementData.progress || 0)
        achievement.unlocked = !!achievementData.unlocked
        achievement.unlockedDate = parseUnlockedDate(achievementData.unlockedDate)
        // Update xpReward from Firestore if available (in case it was changed)
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
          progress: (typeof achievementData.progress === 'number') ? achievementData.progress : (achievementData.progress || 0),
          unlocked: !!achievementData.unlocked,
          unlockedDate: parseUnlockedDate(achievementData.unlockedDate),
        })
      }
    })
    
    // Update user stats (XP is now calculated from achievements, not stored)
    userStats.value = {
      totalPlants: plantsSnap.size,
      wateringStreak: wateringStreak,
      achievementsUnlocked: unlockedCount,
      currentXP: 0, // Not used anymore - calculated from achievements
      totalXP: 0, // Not used anymore - calculated from achievements
    }
  } catch (error) {
    console.error('Error loading user stats and achievements:', error)
  }
}

// Activity type mappings
const getActivityStyle = (type) => {
  const styles = {
    plant_added: { icon: 'mdi-plus-circle', color: 'success' },
    plant_watered: { icon: 'mdi-water', color: 'primary' },
    achievement_unlocked: { icon: 'mdi-trophy', color: 'warning' },
    plant_photo: { icon: 'mdi-camera', color: 'purple' },
    plant_deleted: { icon: 'mdi-delete', color: 'error' }
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
    
    recentActivities.value = activitiesSnap.docs.map(doc => {
      const data = doc.data()
      console.log('Activity data:', data)
      const style = getActivityStyle(data.type)
      return {
        title: data.title,
        description: data.description,
        icon: style.icon,
        color: style.color,
        timestamp: data.timestamp?.toDate() || new Date()
      }
    })
  } catch (error) {
    console.error('Error loading activities:', error)
  }
}
</script>

<style scoped>
.rewards-container {
  padding-top: 16px;
  padding-bottom: 100px; /* Account for bottom navigation */
}

.stats-card {
  border-radius: 12px !important;
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.achievement-card {
  border-radius: 12px !important;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.achievement-card:hover {
  transform: translateY(-2px);
}

.achievement-card--unlocked {
  border: 2px solid rgba(var(--v-theme-success), 0.3);
}

.achievement-icon {
  position: relative;
  display: inline-block;
}

.lock-icon {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: white;
  border-radius: 50%;
  padding: 2px;
}

.achievement-status-section {
  height: 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.achievement-status-section--unlocked {
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .rewards-container {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
