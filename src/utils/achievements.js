import { doc, setDoc, runTransaction, serverTimestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Handle updating achievements when a new plant is added.
 */
export async function handlePlantAdded(userId) {
  if (!userId) return

  try {
    // Mark first plant achievement as unlocked (we'll ensure progress sync below)
    const firstRef = doc(db, 'users', userId, 'achievements', 'first-plant')
    await setDoc(
      firstRef,
      {
        name: 'First Plant',
        xpReward: 10,
      },
      { merge: true }
    )

    // Read user's current plant count and sync collector progress to that count
    const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const count = userSnap.exists() ? (userSnap.data().numberOfPlants || 0) : 0
  console.log('handlePlantAdded: user', userId, 'plantCount=', count)

    const collectorRef = doc(db, 'users', userId, 'achievements', 'plant-collector')
    const target = 5

    await runTransaction(db, async (t) => {
      const snap = await t.get(collectorRef)
      if (!snap.exists()) {
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
    
    // Ensure first-plant is marked unlocked if count >= 1
    if (count >= 1) {
      await setDoc(firstRef, { progress: 1, target: 1, unlocked: true, unlockedDate: serverTimestamp() }, { merge: true })
    }
    } catch (error) {
    console.error('Error updating achievements on plant added:', error)
  }
}

// TODO: Export other helpers as needed in future (watering, photos, etc.)

export async function handlePlantRemoved(userId) {
  if (!userId) return

  try {
    // Read user's current plant count and sync collector progress to that count
    const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const count = userSnap.exists() ? (userSnap.data().numberOfPlants || 0) : 0
  console.log('handlePlantRemoved: user', userId, 'plantCount=', count)

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

  const lastWateredDate = plant.lastWatered.toDate ? plant.lastWatered.toDate() : new Date(plant.lastWatered)
  const target = new Date(targetDate)
  
  lastWateredDate.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  
  const daysSinceWatering = Math.floor((target - lastWateredDate) / (1000 * 60 * 60 * 24))

  let daysUntilNextWatering
  switch (plant.wateringFrequency) {
    case 'daily':
      daysUntilNextWatering = 1
      break
    case 'frequent':
      daysUntilNextWatering = 2.5
      break
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = target.getTime() === today.getTime()
  
  if (plant.wateringFrequency === 'daily') {
    return daysSinceWatering >= 1
  } else if (plant.wateringFrequency === 'frequent') {
    if (daysSinceWatering < 2) return false
    return daysSinceWatering % 2 === 0 || daysSinceWatering % 3 === 0
  } else {
    if (isToday && daysSinceWatering >= daysUntilNextWatering) {
      return true
    }
    return daysSinceWatering >= daysUntilNextWatering && daysSinceWatering % daysUntilNextWatering === 0
  }
}

/**
 * Handle updating achievements when a plant is watered.
 * Updates: Water Warrior, Consistent Caretaker
 * Only increments if ALL plants that need watering today have been watered
 */
export async function handlePlantWatered(userId) {
  if (!userId) return

  try {
    // Get all user's plants
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)
    
    const plants = plantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (plants.length === 0) {
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Check if there are any plants that still need watering today
    // (plants that need watering but haven't been watered today)
    const hasPendingWatering = plants.some(plant => {
      // If plant has never been watered, it still needs water
      if (!plant.lastWatered) return true
      
      const lastWateredDate = plant.lastWatered.toDate ? plant.lastWatered.toDate() : new Date(plant.lastWatered)
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
      today: today.toISOString()
    })

    if (!allWatered) {
      // Still have pending tasks, don't increment but don't reset
      return
    }

    // All tasks completed - update achievements
    const updateConsecutiveDays = async (achievementId, achievementName, target, xpReward) => {
      const achievementRef = doc(db, 'users', userId, 'achievements', achievementId)
      
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
            const daysDiff = Math.floor((todayTimestamp - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
            
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
          }
        }
      })
    }

    // Update Water Warrior (5 days in a row)
    await updateConsecutiveDays('water-warrior', 'Water Warrior', 5, 25)

    // Update Consistent Caretaker (7 days straight)
    await updateConsecutiveDays('consistent-caretaker', 'Consistent Caretaker', 7, 75)

  } catch (error) {
    console.error('Error updating achievements on plant watered:', error)
  }
}

/**
 * Handle updating Green Thumb achievement (keep all plants healthy for 30 days)
 * Only increments if ALL plants are healthy (no pending watering tasks)
 * If there are pending tasks, progress stays the same until end of day
 */
export async function handleAllPlantsHealthy(userId) {
  if (!userId) return

  try {
    // Get all user's plants
    const plantsRef = collection(db, 'plants')
    const plantsQuery = query(plantsRef, where('userId', '==', userId))
    const plantsSnap = await getDocs(plantsQuery)
    
    const plants = plantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (plants.length === 0) {
      // No plants, can't have all healthy
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Check if all plants are healthy (no pending watering tasks)
    const hasPendingTasks = plants.some(plant => needsWateringOnDate(plant, today))
    
    if (hasPendingTasks) {
      // There are pending tasks, don't increment but don't reset
      return
    }

    // All plants are healthy - update achievement
    const achievementRef = doc(db, 'users', userId, 'achievements', 'green-thumb')

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
          const daysDiff = Math.floor((todayTimestamp - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))

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
      const unlocked = newProgress >= target
      const wasUnlocked = existing?.unlocked || false

      if (!snap.exists()) {
        t.set(achievementRef, {
          name: 'Green Thumb',
          progress: newProgress,
          target,
          unlocked,
          unlockedDate: unlocked ? serverTimestamp() : null,
          xpReward: 100,
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
    })

  } catch (error) {
    console.error('Error updating Green Thumb achievement:', error)
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
    
    const plants = plantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (plants.length === 0) {
      return
    }

    // Check if there are pending watering tasks
    const hasPendingTasks = plants.some(plant => needsWateringOnDate(plant, today))
    
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
        await setDoc(achievementRef, {
          progress: 0,
          lastCompletedDate: null,
        }, { merge: true })
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
          await setDoc(greenThumbRef, {
            progress: 0,
            lastCompletedDate: null,
          }, { merge: true })
        }
      }
    }

  } catch (error) {
    console.error('Error checking daily achievement reset:', error)
  }
}

// Functions are exported where they are declared (named exports). No additional export block needed.
