# 🔔 Push Notifications Implementation Plan

## Plant Care Reminder System

**Last Updated:** December 14, 2025  
**Status:** Planning Phase  
**Priority:** HIGH - Required for PWA features and full credit

---

## 📋 Current State Analysis

### ✅ What Already EXISTS

1. **Basic Notification Permission Flow** ([src/views/OnboardingFlow.vue](src/views/OnboardingFlow.vue))
   - Step 2 of onboarding requests notification permissions
   - Uses `Notification.requestPermission()` (Web Notifications API)
   - Saves preferences to Firestore: `notificationsEnabled`, `notificationPermissionGranted`
   - ⚠️ **Limitation:** Only basic browser notifications, NO FCM integration

2. **Plant Data Structure** (Firestore)

   ```javascript
   {
     plantId: string,
     userId: string,
     nickname: string,
     plantType: string,

     // Scheduling fields
     wateringFrequency: string,  // 'daily', 'alternate-days', 'weekly', 'biweekly', 'monthly', 'custom'
     customWateringDays: number,
     lastWatered: timestamp,

     // Care tasks
     needsFertilizer: boolean,
     needsPruning: boolean,

     location: string,
     photoURL: string,
     createdAt: timestamp
   }
   ```

3. **Watering Calculation Logic** ([src/components/CalendarWidget.vue](src/components/CalendarWidget.vue))
   - Accurate next watering date calculations
   - Frequency-based scheduling logic

4. **Firebase Project Setup**
   - Project: `planttracker-35804`
   - Messaging Sender ID: `656630799544` (ready for FCM)
   - Auth, Firestore, Storage already configured

### ❌ What's MISSING

1. ❌ **No Service Worker** - Required for background notifications
2. ❌ **No PWA Manifest** - Required for installability
3. ❌ **No FCM Integration** - Firebase Messaging not initialized
4. ❌ **No Notification Scheduling Logic** - No automated reminder system
5. ❌ **No Background Sync** - Can't check schedules when app closed

---

## 🎯 Implementation Strategy

### **OPTION A: Full FCM with Background Notifications** (Recommended for Production)

**Requirements:**

- Firebase Console access (to enable Cloud Messaging & generate VAPID key)
- Service worker setup
- FCM token management

**Pros:**

- ✅ Works even when app is completely closed
- ✅ Works on locked devices
- ✅ Reliable, server-side scheduling
- ✅ Multi-device support (tokens per device)
- ✅ Industry standard, best UX

**Cons:**

- ❌ Requires Firebase Console access
- ❌ More complex setup
- ❌ May need Blaze plan for Cloud Functions (for scheduled sends)

---

### **OPTION B: Web Notifications Only** (Quick Implementation, No Firebase Console)

**Requirements:**

- Just browser Notification API (already partially implemented)
- Client-side scheduling when app opens

**Pros:**

- ✅ No Firebase Console access needed
- ✅ Simpler implementation
- ✅ Free (no Cloud Functions)
- ✅ Can start immediately

**Cons:**

- ❌ Only works when app is open or recently opened
- ❌ Won't work when app fully closed or device locked
- ❌ Less reliable than FCM

---

### **OPTION C: In-App Reminders Only** (Fallback)

**Requirements:**

- Just UI updates when user opens app

**Pros:**

- ✅ Easiest to implement
- ✅ No permissions needed
- ✅ No external dependencies

**Cons:**

- ❌ Not real "push notifications"
- ❌ Only visible when user opens app
- ❌ Less engaging

---

## 🚀 Detailed Implementation Plan (Option A - Full FCM)

### **Step 1: Firebase Console Setup** ⚙️

**Person:** Team member with Firebase Console access

**Actions:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `planttracker-35804`
3. Navigate to **Project Settings → Cloud Messaging**
4. Enable **Firebase Cloud Messaging API (V1)**
5. Under **Web Push certificates**, click **Generate key pair**
6. Copy the VAPID key (looks like: `BGtd...`)
7. Add to `.env.local`:

   ```
   VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
   ```

8. Update Firestore Security Rules to allow FCM token storage:
   ```javascript
   // In firestore.rules
   match /users/{userId} {
     allow read, write: if request.auth.uid == userId;

     // Allow storing FCM tokens
     allow update: if request.auth.uid == userId
       && request.resource.data.keys().hasOnly(['fcmTokens', 'notificationsEnabled', 'notificationPermissionGranted']);
   }
   ```

**Deliverable:** VAPID key added to `.env.local`, Firestore rules updated

---

### **Step 2: Install PWA Dependencies** 📦

**File:** `package.json`

```bash
npm install vite-plugin-pwa workbox-window --save
```

**Update `vite.config.js`:**

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    vuetify(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Plant Care Tracker',
        short_name: 'PlantCare',
        description: 'Track and care for your plants with smart reminders',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
```

**Deliverable:** PWA plugin installed, manifest configured

---

### **Step 3: Create Service Worker for FCM** 🔧

**File:** `public/firebase-messaging-sw.js`

```javascript
// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration (same as src/firebase.js)
const firebaseConfig = {
  apiKey: 'AIzaSyBXeFR-DRpTQxm6fMePb1tJJDQtX6bTdBo',
  authDomain: 'planttracker-35804.firebaseapp.com',
  projectId: 'planttracker-35804',
  storageBucket: 'planttracker-35804.firebasestorage.app',
  messagingSenderId: '656630799544',
  appId: '1:656630799544:web:a4d95e08e7e7ac9a0d7a46',
  measurementId: 'G-QSK40VQNXP',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification.title || 'Plant Care Reminder'
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: payload.data,
    actions: [
      {
        action: 'water',
        title: '💧 Water Now',
      },
      {
        action: 'later',
        title: '⏰ Remind Later',
      },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const plantId = event.notification.data?.plantId
  const action = event.action

  if (action === 'water') {
    // Open app and navigate to water plant action
    event.waitUntil(clients.openWindow(`/app/plants/${plantId}?action=water`))
  } else if (action === 'later') {
    // Reschedule notification (handled in app)
    event.waitUntil(clients.openWindow(`/app/plants/${plantId}?action=snooze`))
  } else {
    // Default: open plant detail page
    event.waitUntil(clients.openWindow(`/app/plants/${plantId}`))
  }
})
```

**File:** `index.html` (register service worker)

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  }
</script>
```

**Deliverable:** Service worker created and registered

---

### **Step 4: Initialize FCM in Firebase** 🔥

**File:** `src/firebase.js`

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'
import { getMessaging, isSupported } from 'firebase/messaging' // ADD THIS

const firebaseConfig = {
  // ... existing config
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

// Initialize messaging (with browser support check)
export const messaging = (await isSupported()) ? getMessaging(app) : null

if (!messaging) {
  console.warn('Firebase Messaging not supported in this browser')
}
```

**Deliverable:** FCM initialized in firebase.js

---

### **Step 5: Create Notification Service** 🛠️

**File:** `src/services/notificationService.js`

```javascript
import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { messaging, db } from '@/firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Plant-themed notification messages
 */
const NOTIFICATION_TEMPLATES = {
  watering: [
    { title: '💧 Time to Water!', body: '🌱 {plantName} is getting thirsty!' },
    { title: '🌿 Plant Alert!', body: '{plantName} is calling for water! 💦' },
    { title: '💚 Hydration Time!', body: 'Your {plantType} needs a drink 🪴' },
    { title: "🌱 Don't Forget!", body: '{plantName} misses you! Time to water 💧' },
    { title: '🪴 Care Time!', body: '{plantName} says: "I\'m thirsty!" 💦' },
  ],
  fertilizer: [
    { title: '🌱 Feeding Time!', body: '{plantName} needs some nutrients! 🌿' },
    { title: '💚 Fertilizer Reminder', body: 'Give {plantName} some food today! 🪴' },
    { title: '🌿 Plant Nutrition', body: 'Your {plantType} is ready for fertilizer!' },
  ],
  pruning: [
    { title: '✂️ Grooming Time!', body: '{plantName} could use a trim! 🌿' },
    { title: '🌱 Maintenance Alert', body: 'Time to prune {plantName}! ✨' },
    { title: '🪴 Plant Care', body: '{plantName} needs some grooming today!' },
  ],
}

/**
 * Request notification permission and get FCM token
 */
export async function requestPermissionAndToken(userId) {
  try {
    if (!messaging) {
      console.warn('Messaging not supported')
      return null
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })

    if (token) {
      console.log('FCM Token:', token)

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
 */
async function saveTokenToFirestore(userId, token) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      notificationsEnabled: true,
      notificationPermissionGranted: true,
    })
    console.log('Token saved to Firestore')
  } catch (error) {
    console.error('Error saving token:', error)
  }
}

/**
 * Get random notification template
 */
function getRandomTemplate(type) {
  const templates = NOTIFICATION_TEMPLATES[type]
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Generate notification content with plant data
 */
export function getNotificationContent(plant, reminderType) {
  const template = getRandomTemplate(reminderType)

  return {
    title: template.title,
    body: template.body
      .replace('{plantName}', plant.nickname)
      .replace('{plantType}', plant.plantType),
    icon: plant.photoURL || '/icons/icon-192.png',
    data: {
      plantId: plant.id,
      type: reminderType,
      plantName: plant.nickname,
    },
  }
}

/**
 * Calculate next notification time based on plant schedule
 */
export function calculateNextNotificationTime(plant, reminderType) {
  const now = new Date()

  if (reminderType === 'watering') {
    const lastWatered = plant.lastWatered?.toDate() || now
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
    nextDate.setHours(9, 0, 0, 0) // 9 AM by default

    return nextDate
  }

  if (reminderType === 'fertilizer' && plant.needsFertilizer) {
    // Monthly fertilizer reminder
    const nextDate = new Date(now)
    nextDate.setMonth(nextDate.getMonth() + 1)
    nextDate.setHours(10, 0, 0, 0) // 10 AM
    return nextDate
  }

  if (reminderType === 'pruning' && plant.needsPruning) {
    // Quarterly pruning reminder
    const nextDate = new Date(now)
    nextDate.setMonth(nextDate.getMonth() + 3)
    nextDate.setHours(14, 0, 0, 0) // 2 PM
    return nextDate
  }

  return null
}

/**
 * Schedule notifications for user's plants (client-side)
 */
export async function scheduleNotifications(userId, plants) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists() || !userSnap.data().notificationsEnabled) {
      console.log('Notifications disabled for user')
      return
    }

    const scheduledNotifications = []

    for (const plant of plants) {
      // Watering reminder
      const wateringTime = calculateNextNotificationTime(plant, 'watering')
      if (wateringTime && wateringTime > new Date()) {
        scheduledNotifications.push({
          plantId: plant.id,
          type: 'watering',
          scheduledFor: wateringTime,
          content: getNotificationContent(plant, 'watering'),
        })
      }

      // Fertilizer reminder
      const fertilizerTime = calculateNextNotificationTime(plant, 'fertilizer')
      if (fertilizerTime && fertilizerTime > new Date()) {
        scheduledNotifications.push({
          plantId: plant.id,
          type: 'fertilizer',
          scheduledFor: fertilizerTime,
          content: getNotificationContent(plant, 'fertilizer'),
        })
      }

      // Pruning reminder
      const pruningTime = calculateNextNotificationTime(plant, 'pruning')
      if (pruningTime && pruningTime > new Date()) {
        scheduledNotifications.push({
          plantId: plant.id,
          type: 'pruning',
          scheduledFor: pruningTime,
          content: getNotificationContent(plant, 'pruning'),
        })
      }
    }

    console.log(`Scheduled ${scheduledNotifications.length} notifications`)

    // Store scheduled notifications in Firestore for Cloud Functions to send
    // OR use client-side setTimeout (less reliable)

    return scheduledNotifications
  } catch (error) {
    console.error('Error scheduling notifications:', error)
    return []
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export function listenForMessages(callback) {
  if (!messaging) return

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload)

    // Show in-app notification (toast/snackbar) instead of system notification
    callback(payload)
  })
}

/**
 * Send test notification (for testing in Settings)
 */
export async function sendTestNotification(plant) {
  const content = getNotificationContent(plant, 'watering')

  if (Notification.permission === 'granted') {
    new Notification(content.title, {
      body: content.body,
      icon: content.icon,
      badge: '/icons/badge-72.png',
    })
  }
}
```

**Deliverable:** Complete notification service with scheduling logic

---

### **Step 6: Update Onboarding Flow** 🚀

**File:** `src/views/OnboardingFlow.vue`

**Replace the notification permission step:**

```javascript
// BEFORE (basic Notification API):
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      formData.notificationPermissionGranted = true
      console.log('Notification permission granted')
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
  }
}

// AFTER (FCM integration):
import { requestPermissionAndToken } from '@/services/notificationService'

const requestNotificationPermission = async () => {
  notificationLoading.value = true

  try {
    const token = await requestPermissionAndToken(user.value.uid)

    if (token) {
      formData.notificationPermissionGranted = true
      showSuccess.value = true
      successMessage.value = "🔔 Notifications enabled! We'll remind you when to water your plants."
    } else {
      formData.notificationPermissionGranted = false
      showError.value = true
      errorMessage.value = 'Notification permission denied. You can enable it later in Settings.'
    }
  } catch (error) {
    console.error('Error setting up notifications:', error)
    showError.value = true
    errorMessage.value = 'Failed to setup notifications. You can try again in Settings.'
  } finally {
    notificationLoading.value = false
  }
}
```

**Add better UI explanation:**

```vue
<v-card-text>
  <v-alert type="info" variant="tonal" class="mb-4">
    <v-alert-title>Why enable notifications?</v-alert-title>
    <ul class="mt-2">
      <li>💧 Get reminded when your plants need watering</li>
      <li>🌱 Never miss fertilizer or pruning schedules</li>
      <li>🪴 Receive fun, plant-themed reminders</li>
    </ul>
  </v-alert>
  
  <div class="text-center mb-4">
    <v-icon size="80" color="primary">mdi-bell-ring</v-icon>
  </div>
  
  <p class="text-body-1 mb-4">
    Enable notifications to get timely reminders for plant care. 
    We'll send you gentle reminders when your plants need attention! 🌿
  </p>
</v-card-text>
```

**Deliverable:** Onboarding uses FCM token generation

---

### **Step 7: Update Settings Page** ⚙️

**File:** `src/views/SettingsPage.vue`

**Add notification preferences section:**

```vue
<v-card class="mb-4">
  <v-card-title>
    <v-icon class="mr-2">mdi-bell</v-icon>
    Notification Preferences
  </v-card-title>
  
  <v-divider></v-divider>
  
  <v-card-text>
    <v-switch
      v-model="notificationSettings.enabled"
      label="Enable Notifications"
      color="primary"
      @change="updateNotificationSettings"
    ></v-switch>
    
    <v-divider class="my-4"></v-divider>
    
    <div v-if="notificationSettings.enabled">
      <v-switch
        v-model="notificationSettings.wateringReminders"
        label="Watering Reminders 💧"
        color="primary"
        @change="updateNotificationSettings"
      ></v-switch>
      
      <v-switch
        v-model="notificationSettings.fertilizerReminders"
        label="Fertilizer Reminders 🌱"
        color="primary"
        @change="updateNotificationSettings"
      ></v-switch>
      
      <v-switch
        v-model="notificationSettings.pruningReminders"
        label="Pruning Reminders ✂️"
        color="primary"
        @change="updateNotificationSettings"
      ></v-switch>
      
      <v-divider class="my-4"></v-divider>
      
      <v-select
        v-model="notificationSettings.preferredTime"
        :items="['Morning (9 AM)', 'Afternoon (2 PM)', 'Evening (6 PM)']"
        label="Preferred Notification Time"
        @change="updateNotificationSettings"
      ></v-select>
      
      <v-btn
        block
        variant="outlined"
        color="primary"
        class="mt-4"
        @click="sendTestNotification"
      >
        <v-icon left>mdi-bell-ring</v-icon>
        Send Test Notification
      </v-btn>
    </div>
  </v-card-text>
</v-card>
```

**Add methods:**

```javascript
import { sendTestNotification } from '@/services/notificationService'

const notificationSettings = ref({
  enabled: true,
  wateringReminders: true,
  fertilizerReminders: true,
  pruningReminders: true,
  preferredTime: 'Morning (9 AM)',
})

const updateNotificationSettings = async () => {
  try {
    const userRef = doc(db, 'users', user.value.uid)
    await updateDoc(userRef, {
      notificationSettings: notificationSettings.value,
    })
    console.log('Notification settings updated')
  } catch (error) {
    console.error('Error updating settings:', error)
  }
}

const sendTestNotificationHandler = async () => {
  // Get user's first plant for testing
  const plantsQuery = query(
    collection(db, 'plants'),
    where('userId', '==', user.value.uid),
    limit(1),
  )
  const snapshot = await getDocs(plantsQuery)

  if (!snapshot.empty) {
    const plant = snapshot.docs[0].data()
    await sendTestNotification(plant)
  } else {
    alert('Add a plant first to test notifications!')
  }
}
```

**Deliverable:** Settings page with notification controls

---

### **Step 8: Schedule Notifications on App Load** 🔄

**File:** `src/views/HomePage.vue`

```javascript
import { scheduleNotifications } from '@/services/notificationService'

onMounted(async () => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser

      // Listen for plants
      const plantsQuery = query(collection(db, 'plants'), where('userId', '==', currentUser.uid))

      onSnapshot(plantsQuery, async (snapshot) => {
        plants.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Schedule notifications whenever plants data changes
        await scheduleNotifications(currentUser.uid, plants.value)
      })

      // Fetch weather data
      fetchWeatherData()
    }
  })
})
```

**Deliverable:** Automatic notification scheduling

---

### **Step 9: Handle Foreground Messages** 📱

**File:** `src/App.vue`

```javascript
import { listenForMessages } from '@/services/notificationService'
import { onMounted, ref } from 'vue'

const showNotificationSnackbar = ref(false)
const notificationMessage = ref('')

onMounted(() => {
  // Listen for messages when app is open
  listenForMessages((payload) => {
    notificationMessage.value = `${payload.notification.title}: ${payload.notification.body}`
    showNotificationSnackbar.value = true
  })
})
```

**Add snackbar to template:**

```vue
<v-snackbar v-model="showNotificationSnackbar" :timeout="5000" color="primary" location="top">
  {{ notificationMessage }}
  <template v-slot:actions>
    <v-btn
      variant="text"
      @click="showNotificationSnackbar = false"
    >
      Close
    </v-btn>
  </template>
</v-snackbar>
```

**Deliverable:** Foreground notifications handled

---

## 🧪 Testing Checklist

### Local Development Testing

- [ ] Test notification permission flow in onboarding
- [ ] Verify FCM token saved to Firestore
- [ ] Test notification scheduling logic
- [ ] Send test notification from Settings
- [ ] Test foreground notifications (app open)
- [ ] Test background notifications (app closed)
- [ ] Verify notification click opens correct plant page
- [ ] Test notification actions (Water Now, Remind Later)

### Device Testing

- [ ] Test on Chrome Android (FCM fully supported)
- [ ] Test on Safari iOS (limited support, falls back to Web Notifications)
- [ ] Test on Chrome Desktop
- [ ] Test notification on locked device
- [ ] Test with app installed as PWA

### Edge Cases

- [ ] Test with notifications disabled in browser settings
- [ ] Test with no internet connection
- [ ] Test with user logged out
- [ ] Test with no plants added
- [ ] Test token refresh after expiration

---

## 📊 Firestore Data Structure

### User Document Updates

```javascript
{
  uid: string,
  email: string,
  displayName: string,

  // Notification fields
  fcmTokens: string[],  // Array of FCM tokens (supports multiple devices)
  notificationsEnabled: boolean,
  notificationPermissionGranted: boolean,
  notificationSettings: {
    enabled: boolean,
    wateringReminders: boolean,
    fertilizerReminders: boolean,
    pruningReminders: boolean,
    preferredTime: string  // 'Morning (9 AM)', 'Afternoon (2 PM)', 'Evening (6 PM)'
  },

  // Existing fields
  numberOfPlants: number,
  location: { latitude: number, longitude: number }
}
```

### Scheduled Notifications Collection (Optional - for Cloud Functions)

```javascript
// Collection: scheduledNotifications
{
  userId: string,
  plantId: string,
  type: string,  // 'watering', 'fertilizer', 'pruning'
  scheduledFor: timestamp,
  sent: boolean,
  content: {
    title: string,
    body: string,
    icon: string
  },
  createdAt: timestamp
}
```

---

## 🚀 Deployment Considerations

### 1. Cloud Functions (Optional - For Reliable Scheduled Sending)

**File:** `functions/scheduledNotifications.js` (if using Cloud Functions)

```javascript
const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.sendScheduledNotifications = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = new Date()

    // Query scheduled notifications due now
    const snapshot = await admin
      .firestore()
      .collection('scheduledNotifications')
      .where('scheduledFor', '<=', now)
      .where('sent', '==', false)
      .get()

    const promises = []

    snapshot.forEach((doc) => {
      const notification = doc.data()

      // Get user's FCM tokens
      const userRef = admin.firestore().doc(`users/${notification.userId}`)

      promises.push(
        userRef.get().then((userSnap) => {
          const tokens = userSnap.data().fcmTokens || []

          if (tokens.length === 0) return

          // Send to all devices
          return admin
            .messaging()
            .sendToDevice(tokens, {
              notification: notification.content,
              data: {
                plantId: notification.plantId,
                type: notification.type,
              },
            })
            .then(() => {
              // Mark as sent
              return doc.ref.update({ sent: true })
            })
        }),
      )
    })

    await Promise.all(promises)
    console.log(`Sent ${promises.length} notifications`)
  })
```

**Note:** Requires Firebase Blaze plan (pay-as-you-go)

### 2. Client-Side Scheduling (Free Alternative)

- Use `setTimeout` to schedule notifications when app opens
- Less reliable (only works if app opened regularly)
- Good for MVP/demo purposes
- Implemented in `notificationService.js`

---

## 🎯 Success Criteria

### Minimum Viable Product (MVP)

- [x] Notification permission requested in onboarding
- [ ] FCM token generated and saved
- [ ] Watering reminders scheduled based on plant frequency
- [ ] Notifications work when app is closed
- [ ] Notification click opens plant detail page
- [ ] Settings page to toggle notifications

### Full Feature Set

- [ ] Fertilizer and pruning reminders
- [ ] Creative, plant-themed notification messages
- [ ] Notification action buttons (Water Now, Snooze)
- [ ] Foreground notification handling (in-app snackbar)
- [ ] Multi-device support (FCM tokens array)
- [ ] Quiet hours configuration
- [ ] Test notification button
- [ ] Cloud Functions for reliable delivery (optional)

---

## 🔗 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)

---

## ⚠️ Important Notes

1. **Firebase Console Access Required** for full FCM implementation
2. **HTTPS Required** - Notifications only work on HTTPS or localhost
3. **Browser Support:**
   - ✅ Chrome/Edge (full FCM support)
   - ✅ Firefox (full FCM support)
   - ⚠️ Safari (limited, Web Notifications only)
4. **iOS Limitations:** Safari on iOS has limited notification support
5. **Token Expiration:** FCM tokens can expire, implement refresh logic
6. **Testing:** Use short watering frequencies (5 minutes) during development

---

**Next Steps:**

1. Get Firebase Console access from teammate
2. Generate VAPID key
3. Install PWA dependencies
4. Implement notification service
5. Test on multiple devices
6. Deploy and monitor

**Estimated Time:** 2-3 days for full implementation
