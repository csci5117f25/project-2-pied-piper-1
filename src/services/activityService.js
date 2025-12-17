import { collection, addDoc, getDocs, query, orderBy, limit, doc, runTransaction } from 'firebase/firestore'
import { db } from '@/firebase'
import { calculateLevel } from '@/utils/achievements'

/**
 * Activity Types
 */
export const ACTIVITY_TYPES = {
  PLANT_ADDED: 'plant_added',
  PLANT_WATERED: 'plant_watered',
  PLANT_DELETED: 'plant_deleted',
  PLANT_PHOTO: 'plant_photo',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
}

/**
 * XP rewards for different activities
 */
export const ACTIVITY_XP = {
  [ACTIVITY_TYPES.PLANT_ADDED]: 10,
  [ACTIVITY_TYPES.PLANT_WATERED]: 5,
  [ACTIVITY_TYPES.PLANT_DELETED]: 0,
  [ACTIVITY_TYPES.PLANT_PHOTO]: 5,
  [ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED]: 0, // XP comes from the achievement itself
}

/**
 * Activity metadata (icons, colors, titles)
 */
export const ACTIVITY_META = {
  [ACTIVITY_TYPES.PLANT_ADDED]: {
    icon: 'mdi-plus-circle',
    color: 'success',
    defaultTitle: 'Added New Plant',
  },
  [ACTIVITY_TYPES.PLANT_WATERED]: {
    icon: 'mdi-water',
    color: 'primary',
    defaultTitle: 'Watered Plant',
  },
  [ACTIVITY_TYPES.PLANT_DELETED]: {
    icon: 'mdi-delete',
    color: 'error',
    defaultTitle: 'Removed Plant',
  },
  [ACTIVITY_TYPES.PLANT_PHOTO]: {
    icon: 'mdi-camera',
    color: 'purple',
    defaultTitle: 'Added Photo',
  },
  [ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED]: {
    icon: 'mdi-trophy',
    color: 'warning',
    defaultTitle: 'Achievement Unlocked',
  },
}

/**
 * Log an activity to the user's activity subcollection
 * @param {string} userId - The user's ID
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @param {Object} details - Additional details about the activity
 * @returns {Promise<Object|null>} The created activity document or null on error
 */
export async function logActivity(userId, type, details = {}) {
  if (!userId || !type) {
    console.error('logActivity: userId and type are required')
    return null
  }

  try {
    const meta = ACTIVITY_META[type] || ACTIVITY_META[ACTIVITY_TYPES.PLANT_ADDED]
    const xpEarned = details.xpEarned ?? ACTIVITY_XP[type] ?? 0

    const activityData = {
      type,
      title: details.title || meta.defaultTitle,
      description: details.description || '',
      icon: details.icon || meta.icon,
      color: details.color || meta.color,
      xpEarned,
      plantId: details.plantId || null,
      plantName: details.plantName || null,
      achievementId: details.achievementId || null,
      achievementName: details.achievementName || null,
      timestamp: new Date(),
      userId,
    }

    const activitiesRef = collection(db, 'users', userId, 'activities')
    const newActivityRef = doc(activitiesRef)

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId)
      const userDoc = await transaction.get(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const currentXP = userData.xp || 0
        const newXP = currentXP + xpEarned
        const newLevel = calculateLevel(newXP)

        transaction.update(userRef, {
          xp: newXP,
          level: newLevel,
        })
      }

      transaction.set(newActivityRef, activityData)
    })

    console.log(`Activity logged: ${type}`, activityData)
    return { id: newActivityRef.id, ...activityData }
  } catch (error) {
    console.error('Error logging activity:', error)
    return null
  }
}

/**
 * Get recent activities for a user
 * @param {string} userId - The user's ID
 * @param {number} maxResults - Maximum number of activities to fetch (default: 10)
 * @returns {Promise<Array>} Array of activity objects
 */
export async function getRecentActivities(userId, maxResults = 10) {
  if (!userId) {
    console.error('getRecentActivities: userId is required')
    return []
  }

  try {
    const activitiesRef = collection(db, 'users', userId, 'activities')
    const activitiesQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(maxResults))
    const snapshot = await getDocs(activitiesQuery)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      }
    })
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return []
  }
}

/**
 * Log a plant watering activity
 * @param {string} userId - The user's ID
 * @param {Object} plant - The plant that was watered
 */
export async function logPlantWatered(userId, plant) {
  return logActivity(userId, ACTIVITY_TYPES.PLANT_WATERED, {
    description: `Watered ${plant.nickname || plant.plantType}`,
    plantId: plant.id,
    plantName: plant.nickname || plant.plantType,
  })
}

/**
 * Log an achievement unlocked activity
 * @param {string} userId - The user's ID
 * @param {Object} achievement - The unlocked achievement
 */
export async function logAchievementUnlocked(userId, achievement) {
  return logActivity(userId, ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED, {
    title: 'Achievement Unlocked!',
    description: `Earned "${achievement.name}" (+${achievement.xpReward} XP)`,
    xpEarned: achievement.xpReward || 0,
    achievementId: achievement.id,
    achievementName: achievement.name,
    icon: achievement.icon || 'mdi-trophy',
    color: 'warning',
  })
}

/**
 * Log a plant photo added activity
 * @param {string} userId - The user's ID
 * @param {Object} plant - The plant that received a photo
 */
export async function logPlantPhotoAdded(userId, plant) {
  return logActivity(userId, ACTIVITY_TYPES.PLANT_PHOTO, {
    description: `Added photo to ${plant.nickname || plant.plantType}`,
    plantId: plant.id,
    plantName: plant.nickname || plant.plantType,
  })
}
