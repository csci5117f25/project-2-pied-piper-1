// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getFunctions } from 'firebase/functions'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyACup9zMEDK6fGtEItR4t40ScGL8TDq2bI',
  authDomain: 'planttracker-35804.firebaseapp.com',
  projectId: 'planttracker-35804',
  storageBucket: 'planttracker-35804.firebasestorage.app',
  messagingSenderId: '656630799544',
  appId: '1:656630799544:web:ade5e2e669e0259260a84d',
  measurementId: 'G-CHHGTKJTK0',
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)
export const app = firebaseApp // Alias for compatibility

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(firebaseApp)

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(firebaseApp)

// Initialize Analytics
export const analytics = getAnalytics(firebaseApp)

// Initialize Firebase Cloud Messaging (with browser support check)
// messaging will be null if not supported (e.g., in incognito mode or unsupported browsers)
let messagingInstance = null

// Initialize messaging asynchronously
isSupported()
  .then((supported) => {
    if (supported) {
      messagingInstance = getMessaging(firebaseApp)
      console.log('Firebase Messaging initialized successfully')
    } else {
      console.warn('Firebase Messaging not supported in this browser')
    }
  })
  .catch((error) => {
    console.warn('Error checking messaging support:', error)
  })

// Initialize Cloud Functions
export const functions = getFunctions(firebaseApp)

// Export a getter for messaging (since it's initialized async)
export const getMessagingInstance = () => messagingInstance
export { messagingInstance as messaging }
