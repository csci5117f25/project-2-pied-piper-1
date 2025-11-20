import { doc, setDoc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Handle updating achievements when a new plant is added.
 */
export async function handlePlantAdded(userId, plantId) {
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

export async function handlePlantRemoved(userId, plantId) {
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

// Functions are exported where they are declared (named exports). No additional export block needed.
