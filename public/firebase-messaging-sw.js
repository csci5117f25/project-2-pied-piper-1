// Firebase Messaging Service Worker
// Handles background push notifications for Plant Care Tracker

// Import Firebase scripts for service worker (compat mode required for SW)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration (must match src/firebase.js)
const firebaseConfig = {
  apiKey: 'AIzaSyACup9zMEDK6fGtEItR4t40ScGL8TDq2bI',
  authDomain: 'planttracker-35804.firebaseapp.com',
  projectId: 'planttracker-35804',
  storageBucket: 'planttracker-35804.firebasestorage.app',
  messagingSenderId: '656630799544',
  appId: '1:656630799544:web:ade5e2e669e0259260a84d',
  measurementId: 'G-CHHGTKJTK0',
}

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'Plant Care Reminder 🌱'
  const notificationOptions = {
    body: payload.notification?.body || 'Your plants need attention!',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.plantId || 'plant-reminder',
    data: {
      plantId: payload.data?.plantId,
      type: payload.data?.type,
      url: payload.data?.plantId ? `/app/plants/${payload.data.plantId}` : '/app/home',
    },
    actions: [
      {
        action: 'water',
        title: '💧 Water Now',
      },
      {
        action: 'snooze',
        title: '⏰ Remind Later',
      },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  const plantId = event.notification.data?.plantId
  const action = event.action
  let targetUrl = '/app/home'

  if (plantId) {
    if (action === 'water') {
      // Open plant page with water action
      targetUrl = `/app/plants/${plantId}?action=water`
    } else if (action === 'snooze') {
      // Open plant page with snooze action
      targetUrl = `/app/plants/${plantId}?action=snooze`
    } else {
      // Default: open plant detail page
      targetUrl = `/app/plants/${plantId}`
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICKED', plantId, action })
          return client.focus()
        }
      }
      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})

// Service worker install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...')
  self.skipWaiting()
})

// Service worker activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...')
  event.waitUntil(clients.claim())
})
