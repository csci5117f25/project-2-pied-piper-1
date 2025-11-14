// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAKwPkVwwDX3WE4nsbdtRsPUeQ3lF1p8EA',
  authDomain: 'plant-care-tracker-cda44.firebaseapp.com',
  projectId: 'plant-care-tracker-cda44',
  storageBucket: 'plant-care-tracker-cda44.firebasestorage.app',
  messagingSenderId: '460044456430',
  appId: '1:460044456430:web:88842d65dda87365593eff',
  measurementId: 'G-PNK7DM0YH7',
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(firebaseApp)

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(firebaseApp)

// Initialize Analytics
export const analytics = getAnalytics(firebaseApp)
