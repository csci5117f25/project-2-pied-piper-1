<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h5 text-center"> 🌱 Plant Care Tracker </v-card-title>
          <v-card-subtitle class="text-center"> Firebase Authentication Test </v-card-subtitle>
          <v-card-text>
            <div v-if="user">
              <v-alert type="success" class="mb-4"> ✅ Successfully logged in! </v-alert>
              <div class="text-center">
                <v-avatar size="80" class="mb-4">
                  <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" />
                  <v-icon v-else size="40">mdi-account-circle</v-icon>
                </v-avatar>
                <h3>{{ user.displayName || user.email }}</h3>
                <p class="text-medium-emphasis">{{ user.email }}</p>
                <p class="text-caption">User ID: {{ user.uid }}</p>
              </div>
            </div>

            <div v-else>
              <v-alert type="info" class="mb-4">
                Please sign in to test Firebase Authentication
              </v-alert>

              <v-form @submit.prevent="signInWithEmail" class="mb-4">
                <v-text-field
                  v-model="email"
                  label="Email"
                  type="email"
                  prepend-icon="mdi-email"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                  class="mb-2"
                />
                <v-text-field
                  v-model="password"
                  label="Password"
                  type="password"
                  prepend-icon="mdi-lock"
                  variant="outlined"
                  :rules="[rules.required]"
                  class="mb-4"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mb-2"
                >
                  Sign In with Email
                </v-btn>
              </v-form>

              <v-divider class="mb-4"></v-divider>

              <v-btn
                @click="signInWithGoogle"
                color="error"
                size="large"
                block
                :loading="loading"
                prepend-icon="mdi-google"
              >
                Sign In with Google
              </v-btn>

              <div class="text-center mt-4">
                <small class="text-medium-emphasis">
                  Test user: test@plantcare.com / password123
                </small>
              </div>
            </div>
          </v-card-text>

          <v-card-actions v-if="user" class="justify-center">
            <v-btn @click="signOut" color="error" variant="outlined"> Sign Out </v-btn>
            <v-btn @click="testFirestore" color="success" variant="outlined">
              Test Firestore
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Firestore Test Results -->
        <v-card v-if="firestoreTest" class="mt-4">
          <v-card-title>🔥 Firestore Test Results</v-card-title>
          <v-card-text>
            <v-alert :type="firestoreTest.success ? 'success' : 'error'" class="mb-2">
              {{ firestoreTest.message }}
            </v-alert>
            <pre v-if="firestoreTest.data" class="text-caption">{{
              JSON.stringify(firestoreTest.data, null, 2)
            }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'

// Reactive data
const user = ref(null)
const email = ref('test@plantcare.com')
const password = ref('password123')
const loading = ref(false)
const firestoreTest = ref(null)

// Form validation rules
const rules = {
  required: (value) => !!value || 'Required.',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Invalid email.'
  },
}

// Authentication functions
const signInWithEmail = async () => {
  loading.value = true
  try {
    // Try to sign in first
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // If user doesn't exist, create account
      try {
        await createUserWithEmailAndPassword(auth, email.value, password.value)
        console.log('✅ New user account created successfully')
      } catch (createError) {
        console.error('❌ Error creating account:', createError.message)
      }
    } else {
      console.error('❌ Sign in error:', error.message)
    }
  } finally {
    loading.value = false
  }
}

const signInWithGoogle = async () => {
  loading.value = true
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  } catch (error) {
    console.error('❌ Google sign in error:', error.message)
  } finally {
    loading.value = false
  }
}

const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    firestoreTest.value = null
  } catch (error) {
    console.error('❌ Sign out error:', error.message)
  }
}

// Firestore test function
const testFirestore = async () => {
  if (!user.value) return

  try {
    const userDocRef = doc(db, 'users', user.value.uid)

    // Create/update user document
    const userData = {
      uid: user.value.uid,
      email: user.value.email,
      displayName: user.value.displayName || 'Test User',
      photoURL: user.value.photoURL || null,
      numberOfPlants: 0,
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    await setDoc(userDocRef, userData, { merge: true })

    // Read the document back
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      firestoreTest.value = {
        success: true,
        message: '✅ Firestore test successful! User document created/updated.',
        data: userDoc.data(),
      }
    } else {
      firestoreTest.value = {
        success: false,
        message: '❌ Failed to retrieve user document after creation.',
      }
    }
  } catch (error) {
    firestoreTest.value = {
      success: false,
      message: `❌ Firestore error: ${error.message}`,
    }
    console.error('❌ Firestore test error:', error)
  }
}

// Listen for authentication state changes
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      console.log('✅ User authenticated:', currentUser.email)
    } else {
      console.log('🚪 User signed out')
    }
  })
})
</script>
