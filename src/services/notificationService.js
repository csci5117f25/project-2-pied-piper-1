/**
 * Notification Service
 * Handles FCM push notifications for plant care reminders
 *
 * Features:
 * - FCM token management
 * - Plant-themed notification messages
 * - Watering, fertilizer, and pruning reminders
 * - Foreground message handling
 */

import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { messaging, db, functions } from '@/firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Creative plant-themed notification messages
 */
const NOTIFICATION_TEMPLATES = {
  watering: [
    { title: '💧 Time to Water!', body: '🌱 {plantName} is getting thirsty!' },
    { title: '🌿 Plant Alert!', body: '{plantName} is calling for water! 💦' },
    { title: '💚 Hydration Time!', body: 'Your {plantType} needs a drink 🪴' },
    { title: "🌱 Don't Forget!", body: '{plantName} misses you! Time to water 💧' },
    { title: '🪴 Care Time!', body: '{plantName} says: "I\'m thirsty!" 💦' },
    { title: '🌊 Water Break!', body: 'Give {plantName} some love today! 💚' },
    { title: '💦 Splash Time!', body: '{plantName} is dreaming of water drops!' },
    { title: '🌿 Gentle Reminder', body: 'Your beautiful {plantType} awaits watering!' },
  ],
  fertilizer: [
    { title: '🌱 Feeding Time!', body: '{plantName} needs some nutrients! 🌿' },
    { title: '💚 Fertilizer Reminder', body: 'Give {plantName} some plant food today! 🪴' },
    { title: '🌿 Nutrition Alert', body: 'Your {plantType} is ready for a boost!' },
    { title: '🪴 Feed Me!', body: '{plantName} is hungry for fertilizer! 🌱' },
    { title: '✨ Growth Boost', body: 'Time to fertilize {plantName} for healthy growth!' },
  ],
  pruning: [
    { title: '✂️ Maintenance Time!', body: '{plantName} needs some care! 🌿' },
    { title: '🌱 Maintenance Alert', body: 'Time to check on {plantName}! ✨' },
    { title: '🪴 Spa Day!', body: '{plantName} needs some maintenance today!' },
    { title: '🛠️ Care Check!', body: 'Give {plantName} some TLC! ✂️' },
    { title: '🌿 Maintenance Due!', body: 'Your {plantType} is ready for upkeep!' },
  ],
}

/**
 * Check if messaging is supported
 */
export function isMessagingSupported() {
  return messaging !== null
}

/**
 * Request notification permission and get FCM token
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} The FCM token or null
 */
export async function requestPermissionAndToken(userId) {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging not supported in this browser')
      return null
    }

    if (!VAPID_KEY) {
      console.error('VAPID key not configured')
      return null
    }

    // Check if notification API is available
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return null
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)

    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Register service worker first
    let registration
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker registered:', registration)
    } catch (swError) {
      console.error('Service Worker registration failed:', swError)
      // Continue without SW for foreground notifications
    }

    // Get FCM token
    // Note: We don't pass the serviceWorkerRegistration here because it can cause issues
    // with the token request if the SW scope is different or if it's already active.
    // The SDK handles the SW registration internally if we don't provide it,
    // or uses the default one.
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    })

    if (token) {
      console.log('FCM Token obtained successfully')

      // Save token to Firestore
      await saveTokenToFirestore(userId, token)

      return token
    } else {
      console.log('No registration token available')
      return null
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

/**
 * Save FCM token to user document (supports multiple devices)
 * @param {string} userId - The user's ID
 * @param {string} token - The FCM token
 */
async function saveTokenToFirestore(userId, token) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      notificationsEnabled: true,
      notificationPermissionGranted: true,
      updatedAt: new Date(),
    })
    console.log('FCM token saved to Firestore')
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}

/**
 * Remove FCM token from user document
 * @param {string} userId - The user's ID
 * @param {string} token - The FCM token to remove
 */
export async function removeTokenFromFirestore(userId, token) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token),
    })
    console.log('FCM token removed from Firestore')
  } catch (error) {
    console.error('Error removing FCM token:', error)
  }
}

/**
 * Get random notification template for a reminder type
 * @param {string} type - The reminder type (watering, fertilizer, pruning)
 * @returns {Object} Template with title and body
 */
function getRandomTemplate(type) {
  const templates = NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.watering
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Generate notification content with plant data
 * @param {Object} plant - The plant object
 * @param {string} reminderType - Type of reminder
 * @returns {Object} Notification content
 */
export function getNotificationContent(plant, reminderType) {
  const template = getRandomTemplate(reminderType)

  return {
    title: template.title,
    body: template.body
      .replace('{plantName}', plant.nickname || 'Your plant')
      .replace('{plantType}', plant.plantType || 'plant'),
    icon: plant.photoURL || '/icon-192x192.png',
    data: {
      plantId: plant.id,
      type: reminderType,
      plantName: plant.nickname,
    },
  }
}

/**
 * Calculate next notification time based on plant schedule
 * @param {Object} plant - The plant object
 * @param {string} reminderType - Type of reminder
 * @returns {Date|null} Next notification date
 */
export function calculateNextNotificationTime(plant, reminderType) {
  const now = new Date()

  if (reminderType === 'watering') {
    const lastWatered = plant.lastWatered?.toDate?.() || plant.lastWatered || now
    let daysToAdd = 7 // default weekly

    switch (plant.wateringFrequency) {
      case 'daily':
        daysToAdd = 1
        break
      case 'alternate-days':
        daysToAdd = 2
        break
      case 'weekly':
        daysToAdd = 7
        break
      case 'biweekly':
        daysToAdd = 14
        break
      case 'monthly':
        daysToAdd = 30
        break
      case 'custom':
        daysToAdd = plant.customWateringDays || 7
        break
    }

    const nextDate = new Date(lastWatered)
    nextDate.setDate(nextDate.getDate() + daysToAdd)
    nextDate.setHours(9, 0, 0, 0) // 9 AM default

    return nextDate
  }

  if (
    reminderType === 'fertilizer' &&
    plant.fertilizerFrequency &&
    plant.fertilizerFrequency !== 'never'
  ) {
    // Calculate based on fertilizer frequency
    const lastFertilized = plant.lastFertilized?.toDate?.() || plant.lastFertilized || now
    let weeksToAdd = 4 // default monthly

    switch (plant.fertilizerFrequency) {
      case 'monthly':
        weeksToAdd = 4
        break
      case 'bimonthly':
        weeksToAdd = 8
        break
      case 'quarterly':
        weeksToAdd = 13
        break
      case 'seasonal':
        weeksToAdd = 16
        break
      case 'custom':
        weeksToAdd = plant.customFertilizerWeeks || 4
        break
    }

    const nextDate = new Date(lastFertilized)
    nextDate.setDate(nextDate.getDate() + weeksToAdd * 7)
    nextDate.setHours(10, 0, 0, 0)
    return nextDate
  }

  if (
    reminderType === 'pruning' &&
    plant.maintenanceFrequency &&
    plant.maintenanceFrequency !== 'never'
  ) {
    // Calculate based on maintenance frequency
    const lastMaintenance = plant.lastMaintenance?.toDate?.() || plant.lastMaintenance || now
    let weeksToAdd = 13 // default quarterly

    switch (plant.maintenanceFrequency) {
      case 'monthly':
        weeksToAdd = 4
        break
      case 'quarterly':
        weeksToAdd = 13
        break
      case 'biannually':
        weeksToAdd = 26
        break
      case 'annually':
        weeksToAdd = 52
        break
      case 'custom':
        weeksToAdd = plant.customMaintenanceWeeks || 12
        break
    }

    const nextDate = new Date(lastMaintenance)
    nextDate.setDate(nextDate.getDate() + weeksToAdd * 7)
    nextDate.setHours(14, 0, 0, 0)
    return nextDate
  }

  return null
}

/**
 * Parse time string (e.g. "11:00 AM" or "14:30") to hours and minutes
 * @param {string} timeStr - Time string
 * @returns {Object} { hours, minutes }
 */
function parseTime(timeStr) {
  if (!timeStr) return { hours: 9, minutes: 0 } // Default 9 AM

  try {
    // Handle 24h format (HH:mm)
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return { hours, minutes }
    }

    // Handle 12h format (hh:mm AM/PM)
    const [time, period] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    return { hours, minutes }
  } catch (e) {
    console.error('Error parsing time:', e)
    return { hours: 9, minutes: 0 }
  }
}

/**
 * Check and schedule local notifications based on user settings
 * @param {string} userId - The user's ID
 * @param {Array} plants - Array of plants
 */
export async function checkAndScheduleNotifications(userId, plants) {
  if (!userId || !plants || plants.length === 0) return

  try {
    // Check if already notified today
    const today = new Date().toDateString()
    const lastNotificationDate = localStorage.getItem('lastNotificationDate')
    if (lastNotificationDate === today) {
      console.log('Already sent notifications today')
      return
    }

    // Get user settings
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) return
    
    const userData = userSnap.data()
    
    // Check if notifications are enabled globally
    if (userData.notificationsEnabled === false) return

    // Get reminder time
    const reminderTimeStr = userData.reminderTime || '09:00 AM'
    const { hours, minutes } = parseTime(reminderTimeStr)

    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)

    // If it's too early, schedule for later
    if (now < reminderTime) {
      const delay = reminderTime.getTime() - now.getTime()
      console.log(`Scheduling notification for ${reminderTimeStr} (in ${Math.round(delay / 60000)} mins)`)
      
      setTimeout(() => {
        triggerLocalNotifications(userData, plants)
      }, delay)
      return
    }

    // If it's time or past time, trigger now
    triggerLocalNotifications(userData, plants)

  } catch (error) {
    console.error('Error scheduling notifications:', error)
  }
}

/**
 * Trigger the actual notifications
 * @param {Object} userData - User data with settings
 * @param {Array} plants - Array of plants
 */
function triggerLocalNotifications(userData, plants) {
  // Double check if already notified (in case of multiple tabs/calls)
  const today = new Date().toDateString()
  if (localStorage.getItem('lastNotificationDate') === today) return

  if (Notification.permission !== 'granted') return

  const settings = userData.notificationSettings || {}
  const wateringEnabled = settings.wateringReminders !== false
  // Fertilizer and pruning are less critical for daily reminders, but can be added

  let notificationsSent = 0

  // Watering notifications
  if (wateringEnabled) {
    const plantsNeedingWater = getPlantsNeedingWaterToday(plants)

    if (plantsNeedingWater.length > 0) {
      if (plantsNeedingWater.length === 1) {
        const plant = plantsNeedingWater[0]
        const content = getNotificationContent(plant, 'watering')
        new Notification(content.title, {
          body: content.body,
          icon: content.icon,
          badge: '/icon-192x192.png',
          tag: `water-${plant.id}`,
        })
        notificationsSent++
      } else {
        const plantNames = plantsNeedingWater
          .slice(0, 3)
          .map((p) => p.nickname)
          .join(', ')
        const remaining = plantsNeedingWater.length - 3
        const suffix = remaining > 0 ? ` and ${remaining} more` : ''
        
        new Notification('🌱 Watering Time!', {
          body: `${plantNames}${suffix} need water today! 💧`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'daily-watering-reminder',
        })
        notificationsSent++
      }
    }
  }

  if (notificationsSent > 0) {
    localStorage.setItem('lastNotificationDate', today)
    console.log(`Sent ${notificationsSent} notification(s)`)
  }
}

/**
 * Check which plants need watering today
 * @param {Array} plants - Array of plant objects
 * @returns {Array} Plants that need watering today
 */
export function getPlantsNeedingWaterToday(plants) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return plants.filter((plant) => {
    const nextWatering = calculateNextNotificationTime(plant, 'watering')
    if (!nextWatering) return false

    const waterDate = new Date(nextWatering)
    waterDate.setHours(0, 0, 0, 0)

    return waterDate.getTime() <= today.getTime()
  })
}

/**
 * Schedule local notifications for plants (client-side fallback)
 * @param {Array} plants - Array of plant objects
 */
export function scheduleLocalNotifications(plants) {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const plantsNeedingWater = getPlantsNeedingWaterToday(plants)

  if (plantsNeedingWater.length > 0) {
    // Show a combined notification for all plants
    const plantNames = plantsNeedingWater.map((p) => p.nickname).join(', ')
    const body =
      plantsNeedingWater.length === 1
        ? `${plantNames} needs water today! 💧`
        : `${plantsNeedingWater.length} plants need water: ${plantNames} 💧`

    new Notification('🌱 Plant Care Reminder', {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'daily-watering-reminder',
    })
  }
}

/**
 * Listen for foreground messages (when app is open)
 * @param {Function} callback - Function to handle the message
 */
export function listenForMessages(callback) {
  if (!messaging) {
    console.warn('Messaging not supported')
    return null
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload)
    callback(payload)
  })
}

/**
 * Send a test notification (for testing purposes)
 * @param {Object} plant - Plant object to use for notification content
 * @param {string} type - Type of notification to test
 */
export async function sendTestNotification(plant, type = 'watering') {
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return false
    }
  }

  // Try server-side first to verify full pipeline
  try {
    console.log('Requesting server-side test notification...')
    const sendTest = httpsCallable(functions, 'sendTestNotification')
    const result = await sendTest()
    console.log('Server test result:', result.data)
    
    if (result.data && result.data.success > 0) {
      return true
    }
    console.warn('Server reported 0 successes, falling back to local')
  } catch (error) {
    console.warn('Server test failed, falling back to local:', error)
  }

  // Fallback to local notification
  const content = getNotificationContent(
    plant || { nickname: 'Test Plant', plantType: 'Succulent' },
    type,
  )

  new Notification(content.title, {
    body: content.body,
    icon: content.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'test-notification',
  })

  return true
}

/**
 * Check notification status for user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Notification status
 */
export async function getNotificationStatus(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return {
        enabled: false,
        permissionGranted: false,
        hasToken: false,
      }
    }

    const data = userSnap.data()
    return {
      enabled: data.notificationsEnabled || false,
      permissionGranted: data.notificationPermissionGranted || false,
      hasToken: (data.fcmTokens?.length || 0) > 0,
      settings: data.notificationSettings || null,
    }
  } catch (error) {
    console.error('Error getting notification status:', error)
    return {
      enabled: false,
      permissionGranted: false,
      hasToken: false,
    }
  }
}

/**
 * Update notification settings
 * @param {string} userId - The user's ID
 * @param {Object} settings - Notification settings
 */
export async function updateNotificationSettings(userId, settings) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      notificationSettings: settings,
      notificationsEnabled: settings.enabled,
      updatedAt: new Date(),
    })
    console.log('Notification settings updated')
    return true
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return false
  }
}
