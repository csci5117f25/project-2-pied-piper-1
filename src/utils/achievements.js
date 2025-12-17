import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Handle updating achievements when a new plant is added.
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export async function handlePlantAdded(userId, plantCount = null) {
  if (!userId) return []

  const unlockedAchievements = []

  try {
    // Get actual plant count from database to ensure accuracy
    const plantsRef = collection(db, 'plants')
    const q = query(plantsRef, where('userId', '==', userId))
    const snapshot = await getDocs(q)
    const count = snapshot.size
    
    console.log('handlePlantAdded: user', userId, 'actualCount=', count)

    // Update user's plant count to match actual count
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, { numberOfPlants: count }, { merge: true })

    // Update first-plant achievement - only when count is exactly 1 (first plant)
    const firstRef = doc(db, 'users', userId, 'achievements', 'first-plant')
    const firstSnap = await getDoc(firstRef)
    const wasFirstUnlocked = firstSnap.exists() && firstSnap.data().unlocked

    // Only process first plant achievement if this is actually the first plant
    if (count === 1 && !wasFirstUnlocked) {
      await setDoc(firstRef, {
        name: 'First Plant',
        progress: 1,
        target: 1,
        unlocked: true,
        unlockedDate: serverTimestamp(),
        xpReward: 10,
      })

      unlockedAchievements.push({
        id: 'first-plant',
        name: 'First Plant',
        icon: 'mdi-sprout-outline',
        xpReward: 10,
        color: 'success',
        description: 'Added your first plant to the garden',
      })
    } else if (count >= 1 && !firstSnap.exists()) {
      // Edge case: user has plants but achievement doc doesn't exist
      // Create it silently without showing unlock animation
      await setDoc(firstRef, {
        name: 'First Plant',
        progress: 1,
        target: 1,
        unlocked: true,
        unlockedDate: serverTimestamp(),
        xpReward: 10,
      })
    }

    // Update plant-collector achievement
    const collectorRef = doc(db, 'users', userId, 'achievements', 'plant-collector')
    const target = 5

    await runTransaction(db, async (t) => {
      const snap = await t.get(collectorRef)
      const existing = snap.exists() ? snap.data() : null
      const wasUnlocked = existing?.unlocked || false
      const unlocked = count >= target

      if (!snap.exists()) {
        t.set(collectorRef, {
          name: 'Plant Collector',
          progress: count,
          target,
          unlocked,
          unlockedDate: unlocked ? serverTimestamp() : null,
          xpReward: 50,
        })
      } else {
        t.update(collectorRef, { progress: count })
        if (unlocked && !wasUnlocked) {
          t.update(collectorRef, { unlocked: true, unlockedDate: serverTimestamp() })
        } else if (!unlocked && wasUnlocked) {
          t.update(collectorRef, { unlocked: false, unlockedDate: null })
        }
      }

      if (unlocked && !wasUnlocked) {
        unlockedAchievements.push({
          id: 'plant-collector',
          name: 'Plant Collector',
          icon: 'mdi-leaf-circle',
          xpReward: 50,
          color: 'primary',
          description: 'Collected 5 plants in your garden',
        })
      }
    })

    return unlockedAchievements
  } catch (error) {
    console.error('Error updating achievements on plant added:', error)
    return unlockedAchievements
  }
}

// TODO: Export other helpers as needed in future (watering, photos, etc.)

export async function handlePlantRemoved(userId) {
  if (!userId) return

  try {
    // Get actual plant count from database to ensure accuracy
    const plantsRef = collection(db, 'plants')
    const q = query(plantsRef, where('userId', '==', userId))
    const snapshot = await getDocs(q)
    const count = snapshot.size
    
    console.log('handlePlantRemoved: user', userId, 'actualCount=', count)

    // Update user's plant count to match actual count
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, { numberOfPlants: count }, { merge: true })

    const collectorRef = doc(db, 'users', userId, 'achievements', 'plant-collector')
    const target = 5

    await runTransaction(db, async (t) => {
      const snap = await t.get(collectorRef)
      if (!snap.exists()) {
        // create with current count
        t.set(collectorRef, {
          name: 'Plant Collector',
          progress: count,
          target,
          unlocked: count >= target,
          unlockedDate: count >= target ? serverTimestamp() : null,
          xpReward: 50,
        })
      } else {
        const data = snap.data()
        t.update(collectorRef, { progress: count })
        if (count >= (data.target || target) && !data.unlocked) {
          t.update(collectorRef, { unlocked: true, unlockedDate: serverTimestamp() })
        } else if (count < (data.target || target) && data.unlocked) {
          t.update(collectorRef, { unlocked: false, unlockedDate: null })
        }
      }
    })

    // Update first-plant achievement based on current count
    const firstRef = doc(db, 'users', userId, 'achievements', 'first-plant')
    if (count === 0) {
      await setDoc(firstRef, { progress: 0, unlocked: false, unlockedDate: null }, { merge: true })
    } else if (count >= 1) {
      await setDoc(firstRef, { progress: 1, unlocked: true }, { merge: true })
    }
  } catch (error) {
    console.error('Error updating achievements on plant removed:', error)
  }
}

/**
 * Check if a plant needs watering on a specific date
 */
function needsWateringOnDate(plant, targetDate) {
  if (!plant.lastWatered) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    return target >= today
  }

  if (!plant.wateringFrequency) {
    return false
  }

  const lastWateredDate = plant.lastWatered.toDate
    ? plant.lastWatered.toDate()
    : new Date(plant.lastWatered)
  const target = new Date(targetDate)

  lastWateredDate.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  const daysSinceWatering = Math.round((target - lastWateredDate) / (1000 * 60 * 60 * 24))

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
        daysUntilNextWatering = 7
    }

    if (isToday && daysSinceWatering >= daysUntilNextWatering) {
      return true
    }
    return (
      daysSinceWatering >= daysUntilNextWatering && daysSinceWatering % daysUntilNextWatering === 0
    )
  }
}

/**
 * Handle updating achievements when a plant is watered.
 * Updates: Water Warrior, Consistent Caretaker
 * Only increments if ALL plants that need watering today have been watered
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export async function handlePlantWatered(userId) {
  if (!userId) return []

  const unlockedAchievements = []

  try {
    // Get all user's plants
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)

    const plants = plantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (plants.length === 0) {
      return []
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Check if there are any plants that still need watering today
    // (plants that need watering but haven't been watered today)
    const hasPendingWatering = plants.some((plant) => {
      // If plant has never been watered, it still needs water
      if (!plant.lastWatered) return true

      const lastWateredDate = plant.lastWatered.toDate
        ? plant.lastWatered.toDate()
        : new Date(plant.lastWatered)
      lastWateredDate.setHours(0, 0, 0, 0)

      // If it was watered today, it's done
      if (lastWateredDate.getTime() === todayTimestamp) {
        return false
      }

      // Check if it needs watering today
      return needsWateringOnDate(plant, today)
    })

    // If there are no pending watering tasks, all tasks are completed
    const allWatered = !hasPendingWatering

    console.log('Achievement check:', {
      totalPlants: plants.length,
      hasPendingWatering,
      allWatered,
      today: today.toISOString(),
    })

    if (!allWatered) {
      // Still have pending tasks, don't increment but don't reset
      return []
    }

    // All tasks completed - update achievements
    const updateConsecutiveDays = async (
      achievementId,
      achievementName,
      target,
      xpReward,
      icon,
    ) => {
      const achievementRef = doc(db, 'users', userId, 'achievements', achievementId)
      let unlockData = null

      await runTransaction(db, async (t) => {
        const snap = await t.get(achievementRef)
        const existing = snap.exists() ? snap.data() : null

        // Check if we already completed today's task
        const lastCompletedDate = existing?.lastCompletedDate
        if (lastCompletedDate) {
          const lastDateObj = new Date(lastCompletedDate)
          lastDateObj.setHours(0, 0, 0, 0)
          if (lastDateObj.getTime() === todayTimestamp) {
            // Already completed today, don't increment again
            return
          }
        }

        let newProgress = 1

        if (existing) {
          const lastDate = existing.lastCompletedDate
          if (lastDate) {
            const lastDateObj = new Date(lastDate)
            lastDateObj.setHours(0, 0, 0, 0)
            const daysDiff = Math.round(
              (todayTimestamp - lastDateObj.getTime()) / (1000 * 60 * 60 * 24),
            )

            if (daysDiff === 1) {
              // Consecutive day - increment progress
              newProgress = (existing.progress || 0) + 1
            } else if (daysDiff > 1) {
              // Gap in days - reset to 1
              newProgress = 1
            }
          }
        }

        const unlocked = newProgress >= target
        const wasUnlocked = existing?.unlocked || false

        if (!snap.exists()) {
          t.set(achievementRef, {
            name: achievementName,
            progress: newProgress,
            target,
            unlocked,
            unlockedDate: unlocked ? serverTimestamp() : null,
            xpReward,
            lastCompletedDate: todayTimestamp,
          })
        } else {
          t.update(achievementRef, {
            progress: newProgress,
            lastCompletedDate: todayTimestamp,
          })

          if (unlocked && !wasUnlocked) {
            t.update(achievementRef, {
              unlocked: true,
              unlockedDate: serverTimestamp(),
            })
            unlockData = { id: achievementId, name: achievementName, icon, xpReward }
          }
        }
      })

      return unlockData
    }

    // Update Water Warrior (5 days in a row)
    const waterWarriorUnlock = await updateConsecutiveDays(
      'water-warrior',
      'Water Warrior',
      5,
      25,
      'mdi-water',
    )
    if (waterWarriorUnlock) unlockedAchievements.push(waterWarriorUnlock)

    // Update Consistent Caretaker (7 days straight)
    const caretakerUnlock = await updateConsecutiveDays(
      'consistent-caretaker',
      'Consistent Caretaker',
      7,
      75,
      'mdi-calendar-check',
    )
    if (caretakerUnlock) unlockedAchievements.push(caretakerUnlock)

    return unlockedAchievements
  } catch (error) {
    console.error('Error updating achievements on plant watered:', error)
    return unlockedAchievements
  }
}

/**
 * Handle updating Green Thumb achievement (keep all plants healthy for 30 days)
 * Only increments if ALL plants are healthy (no pending watering tasks)
 * If there are pending tasks, progress stays the same until end of day
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} Returns unlock data if achievement was just unlocked
 */
export async function handleAllPlantsHealthy(userId) {
  if (!userId) return null

  try {
    // Get all user's plants
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)

    const plants = plantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (plants.length === 0) {
      // No plants, can't have all healthy
      return null
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Check if all plants are healthy (no pending watering tasks)
    const hasPendingTasks = plants.some((plant) => needsWateringOnDate(plant, today))

    if (hasPendingTasks) {
      // There are pending tasks, don't increment but don't reset
      return null
    }

    // All plants are healthy - update achievement
    const achievementRef = doc(db, 'users', userId, 'achievements', 'green-thumb')
    let unlockData = null

    await runTransaction(db, async (t) => {
      const snap = await t.get(achievementRef)
      const existing = snap.exists() ? snap.data() : null

      // Check if we already completed today's task
      const lastCompletedDate = existing?.lastCompletedDate
      if (lastCompletedDate) {
        const lastDateObj = new Date(lastCompletedDate)
        lastDateObj.setHours(0, 0, 0, 0)
        if (lastDateObj.getTime() === todayTimestamp) {
          // Already completed today, don't increment again
          return
        }
      }

      let newProgress = 1

      if (existing) {
        const lastDate = existing.lastCompletedDate
        if (lastDate) {
          const lastDateObj = new Date(lastDate)
          lastDateObj.setHours(0, 0, 0, 0)
          const daysDiff = Math.round(
            (todayTimestamp - lastDateObj.getTime()) / (1000 * 60 * 60 * 24),
          )

          if (daysDiff === 1) {
            // Consecutive day - increment progress
            newProgress = (existing.progress || 0) + 1
          } else if (daysDiff > 1) {
            // Gap in days - reset to 1
            newProgress = 1
          }
        }
      }

      const target = 30
      const xpReward = 100
      const unlocked = newProgress >= target
      const wasUnlocked = existing?.unlocked || false

      if (!snap.exists()) {
        t.set(achievementRef, {
          name: 'Green Thumb',
          progress: newProgress,
          target,
          unlocked,
          unlockedDate: unlocked ? serverTimestamp() : null,
          xpReward,
          lastCompletedDate: todayTimestamp,
        })
      } else {
        t.update(achievementRef, {
          progress: newProgress,
          lastCompletedDate: todayTimestamp,
        })

        if (unlocked && !wasUnlocked) {
          t.update(achievementRef, {
            unlocked: true,
            unlockedDate: serverTimestamp(),
          })
        }
      }

      if (unlocked && !wasUnlocked) {
        unlockData = {
          id: 'green-thumb',
          name: 'Green Thumb',
          icon: 'mdi-thumb-up',
          xpReward,
        }
      }
    })

    return unlockData
  } catch (error) {
    console.error('Error updating Green Thumb achievement:', error)
    return null
  }
}

/**
 * Daily check function to reset achievements if tasks weren't completed
 * This should be called at the end of the day or when checking achievements
 */
export async function checkDailyAchievementReset(userId) {
  if (!userId) return

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Get all user's plants
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)

    const plants = plantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (plants.length === 0) {
      return
    }

    // Check if there are pending watering tasks
    const hasPendingTasks = plants.some((plant) => needsWateringOnDate(plant, today))

    // Check Water Warrior and Consistent Caretaker
    const checkWateringAchievements = async (achievementId) => {
      const achievementRef = doc(db, 'users', userId, 'achievements', achievementId)
      const achievementSnap = await getDoc(achievementRef)

      if (!achievementSnap.exists()) return

      const data = achievementSnap.data()
      const lastCompletedDate = data.lastCompletedDate

      if (!lastCompletedDate) return

      const lastDateObj = new Date(lastCompletedDate)
      lastDateObj.setHours(0, 0, 0, 0)

      // If last completed date is not today and there are pending tasks, reset
      if (lastDateObj.getTime() !== todayTimestamp && hasPendingTasks) {
        await setDoc(
          achievementRef,
          {
            progress: 0,
            lastCompletedDate: null,
          },
          { merge: true },
        )
      }
    }

    await checkWateringAchievements('water-warrior')
    await checkWateringAchievements('consistent-caretaker')

    // Check Green Thumb
    const greenThumbRef = doc(db, 'users', userId, 'achievements', 'green-thumb')
    const greenThumbSnap = await getDoc(greenThumbRef)

    if (greenThumbSnap.exists()) {
      const data = greenThumbSnap.data()
      const lastCompletedDate = data.lastCompletedDate

      if (lastCompletedDate) {
        const lastDateObj = new Date(lastCompletedDate)
        lastDateObj.setHours(0, 0, 0, 0)

        // If last completed date is not today and there are pending tasks, reset
        if (lastDateObj.getTime() !== todayTimestamp && hasPendingTasks) {
          await setDoc(
            greenThumbRef,
            {
              progress: 0,
              lastCompletedDate: null,
            },
            { merge: true },
          )
        }
      }
    }
  } catch (error) {
    console.error('Error checking daily achievement reset:', error)
  }
}

/**
 * Handle updating Plant Photographer achievement
 * Counts how many different plants have photos
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} Returns unlock data if achievement was just unlocked
 */
export async function handlePlantPhotographed(userId) {
  if (!userId) return null

  try {
    // Get all user's plants and count those with photos
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)

    const plantsWithPhotos = plantsSnap.docs.filter((doc) => {
      const data = doc.data()
      return data.photoURL && data.photoURL.trim() !== ''
    }).length

    console.log('handlePlantPhotographed: user', userId, 'plantsWithPhotos=', plantsWithPhotos)

    const achievementRef = doc(db, 'users', userId, 'achievements', 'plant-photographer')
    const target = 10
    const xpReward = 30
    let unlockData = null

    await runTransaction(db, async (t) => {
      const snap = await t.get(achievementRef)
      const existing = snap.exists() ? snap.data() : null
      const wasUnlocked = existing?.unlocked || false
      const unlocked = plantsWithPhotos >= target

      if (!snap.exists()) {
        t.set(achievementRef, {
          name: 'Plant Photographer',
          progress: plantsWithPhotos,
          target,
          unlocked,
          unlockedDate: unlocked ? serverTimestamp() : null,
          xpReward,
        })
      } else {
        t.update(achievementRef, { progress: plantsWithPhotos })
        if (unlocked && !wasUnlocked) {
          t.update(achievementRef, { unlocked: true, unlockedDate: serverTimestamp() })
        }
      }

      // Return unlock data if just unlocked
      if (unlocked && !wasUnlocked) {
        unlockData = {
          id: 'plant-photographer',
          name: 'Plant Photographer',
          icon: 'mdi-camera',
          xpReward,
        }
      }
    })

    return unlockData
  } catch (error) {
    console.error('Error updating Plant Photographer achievement:', error)
    return null
  }
}

/**
 * Sync all achievements for a user (recalculate progress)
 * Call this on app load to ensure consistency
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export async function syncAllAchievements(userId) {
  if (!userId) return []

  const unlockedAchievements = []

  try {
    // Sync plant-based achievements
    await handlePlantAdded(userId)

    // Sync photo achievement
    const photoUnlock = await handlePlantPhotographed(userId)
    if (photoUnlock) unlockedAchievements.push(photoUnlock)

    // Check daily reset for streak-based achievements
    await checkDailyAchievementReset(userId)

    console.log('All achievements synced for user:', userId)
    return unlockedAchievements
  } catch (error) {
    console.error('Error syncing achievements:', error)
    return unlockedAchievements
  }
}
/**
 * Level progression thresholds
 * Each level requires increasing XP
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, name: 'Seed Starter', icon: 'mdi-seed' },
  { level: 2, xpRequired: 100, name: 'Sprout Caretaker', icon: 'mdi-sprout' },
  { level: 3, xpRequired: 300, name: 'Green Thumb', icon: 'mdi-hand' },
  { level: 4, xpRequired: 600, name: 'Plant Parent', icon: 'mdi-leaf' },
  { level: 5, xpRequired: 1000, name: 'Garden Guardian', icon: 'mdi-tree' },
  { level: 6, xpRequired: 1500, name: 'Plant Whisperer', icon: 'mdi-flower' },
  { level: 7, xpRequired: 2100, name: 'Nature Master', icon: 'mdi-forest' },
]

/**
 * Calculate current level from total XP
 */
export function calculateLevel(totalXP) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
      return LEVEL_THRESHOLDS[i].level
    }
  }
  return 1
}

/**
 * Get level info for a specific level
 */
export function getLevelInfo(level) {
  return LEVEL_THRESHOLDS.find((l) => l.level === level) || LEVEL_THRESHOLDS[0]
}

/**
 * Get XP progress for current level
 */
export function getLevelProgress(totalXP) {
  const currentLevel = calculateLevel(totalXP)
  const currentLevelInfo = getLevelInfo(currentLevel)
  const nextLevelInfo = getLevelInfo(currentLevel + 1)

  if (!nextLevelInfo) {
    // Max level reached
    return {
      currentLevel,
      currentLevelInfo,
      xpInCurrentLevel: totalXP - currentLevelInfo.xpRequired,
      xpNeededForNext: 0,
      progress: 100,
      isMaxLevel: true,
    }
  }

  const xpInCurrentLevel = totalXP - currentLevelInfo.xpRequired
  const xpNeededForNext = nextLevelInfo.xpRequired - currentLevelInfo.xpRequired
  const progress = (xpInCurrentLevel / xpNeededForNext) * 100

  return {
    currentLevel,
    currentLevelInfo,
    nextLevelInfo,
    xpInCurrentLevel,
    xpNeededForNext,
    xpToNextLevel: nextLevelInfo.xpRequired - totalXP,
    progress,
    isMaxLevel: false,
  }
}

/**
 * Check and update user level if XP threshold reached
 * @returns {object|null} Level up info if level increased, null otherwise
 */
export async function checkLevelUp(userId, newXP) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return null

    const currentLevel = userSnap.data().level || 1
    const newLevel = calculateLevel(newXP)

    if (newLevel > currentLevel) {
      await setDoc(userRef, { level: newLevel }, { merge: true })

      const oldLevelInfo = getLevelInfo(currentLevel)
      const newLevelInfo = getLevelInfo(newLevel)

      return {
        oldLevel: currentLevel,
        newLevel,
        oldLevelInfo,
        newLevelInfo,
      }
    }

    return null
  } catch (error) {
    console.error('Error checking level up:', error)
    return null
  }
}

/**
 * XP rewards for each task type
 */
const TASK_XP_REWARDS = {
  water: 30,
  fertilize: 35,
  maintenance: 35,
  allThree: 35, // Bonus XP when all 3 tasks completed on same plant
}

/**
 * Handle task completion and award XP
 * @param {string} userId - The user's ID
 * @param {string} taskType - 'water', 'fertilize', or 'maintenance'
 * @param {string} plantId - The plant's ID
 * @returns {Promise<object>} Object with xpEarned, totalXP, and levelUp info
 */
export async function handleTaskCompleted(userId, taskType, plantId) {
  if (!userId || !taskType || !plantId) {
    return { xpEarned: 0, totalXP: 0, levelUp: null }
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId)
      const userSnap = await transaction.get(userRef)

      if (!userSnap.exists()) {
        throw new Error('User document not found')
      }

      const userData = userSnap.data()
      let tasksCompletedToday = userData.tasksCompletedToday || []
      const currentXP = userData.xp || 0

      // Check if already completed this task for this plant today
      const taskKey = `${plantId}_${taskType}`
      if (tasksCompletedToday.includes(taskKey)) {
        console.log('Task already completed today, no XP awarded')
        return { xpEarned: 0, totalXP: currentXP, levelUp: null, alreadyCompleted: true }
      }

      // Add task to completed list
      tasksCompletedToday.push(taskKey)

      // Calculate XP reward
      let xpEarned = TASK_XP_REWARDS[taskType] || 0

      // Check if all three tasks completed for this plant today
      const waterCompleted = tasksCompletedToday.includes(`${plantId}_water`)
      const fertilizeCompleted = tasksCompletedToday.includes(`${plantId}_fertilize`)
      const maintenanceCompleted = tasksCompletedToday.includes(`${plantId}_maintenance`)

      const allThreeCompleted = waterCompleted && fertilizeCompleted && maintenanceCompleted

      // Award bonus if all three tasks completed (and not already awarded)
      const bonusKey = `${plantId}_bonus`
      if (allThreeCompleted && !tasksCompletedToday.includes(bonusKey)) {
        xpEarned += TASK_XP_REWARDS.allThree
        tasksCompletedToday.push(bonusKey)
      }

      const newTotalXP = currentXP + xpEarned
      
      // Calculate level up inside transaction
      const currentLevel = userData.level || 1
      const newLevel = calculateLevel(newTotalXP)
      let levelUp = null

      if (newLevel > currentLevel) {
        levelUp = {
          oldLevel: currentLevel,
          newLevel,
          oldLevelInfo: getLevelInfo(currentLevel),
          newLevelInfo: getLevelInfo(newLevel),
        }
      }

      // Update user document
      transaction.update(userRef, {
        xp: newTotalXP,
        level: newLevel,
        tasksCompletedToday,
      })

      return {
        xpEarned,
        totalXP: newTotalXP,
        levelUp,
        allThreeCompleted,
      }
    })

    return result
  } catch (error) {
    console.error('Error handling task completion:', error)
    return { xpEarned: 0, totalXP: 0, levelUp: null, error: error.message }
  }
}

/**
 * Reset daily tasks for a user (called at midnight or on first action of new day)
 */
export async function resetDailyTasks(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      {
        tasksCompletedToday: [],
        lastTaskResetDate: serverTimestamp(),
      },
      { merge: true },
    )
    console.log('Daily tasks reset for user:', userId)
    return true
  } catch (error) {
    console.error('Error resetting daily tasks:', error)
    return false
  }
}

/**
 * Check if daily tasks need to be reset (called before task completion)
 */
export async function checkAndResetDailyTasks(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) return false

    const userData = userSnap.data()
    const lastResetDate = userData.lastTaskResetDate?.toDate()

    if (!lastResetDate) {
      // Never reset before, do it now
      await resetDailyTasks(userId)
      return true
    }

    // Check if it's a new day
    const now = new Date()
    const lastReset = new Date(lastResetDate)

    // Compare dates (ignore time)
    const isNewDay =
      now.getFullYear() !== lastReset.getFullYear() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getDate() !== lastReset.getDate()

    if (isNewDay) {
      await resetDailyTasks(userId)
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking daily reset:', error)
    return false
  }
}
