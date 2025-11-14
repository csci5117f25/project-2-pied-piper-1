<template>
  <v-card class="auth-dialog">
    <v-card-title class="text-center pa-6">
      <div>
        <v-icon size="48" color="primary" class="mb-2"> mdi-sprout </v-icon>
        <div class="text-h5 text-primary">Plant Care Tracker</div>
        <div class="text-subtitle-1 text-medium-emphasis">
          {{ isLogin ? 'Welcome back!' : 'Join the plant community' }}
        </div>
      </div>
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Tab Navigation -->
      <v-tabs v-model="activeTab" align-tabs="center" color="primary" class="mb-6">
        <v-tab :value="0">Login</v-tab>
        <v-tab :value="1">Sign Up</v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-tabs-window v-model="activeTab">
        <!-- Login Tab -->
        <v-tabs-window-item :value="0">
          <v-form @submit.prevent="handleEmailLogin" ref="loginForm">
            <v-text-field
              v-model="loginEmail"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              :rules="emailRules"
              :error-messages="authError"
              class="mb-3"
            />

            <v-text-field
              v-model="loginPassword"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              :rules="passwordRules"
              :error-messages="authError"
              class="mb-4"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              class="mb-4 text-none"
            >
              Sign In
            </v-btn>

            <div class="text-center mb-4">
              <v-btn
                variant="text"
                size="small"
                @click="showForgotPassword = true"
                class="text-none"
              >
                Forgot Password?
              </v-btn>
            </div>
          </v-form>
        </v-tabs-window-item>

        <!-- Sign Up Tab -->
        <v-tabs-window-item :value="1">
          <v-form @submit.prevent="handleEmailSignup" ref="signupForm">
            <v-text-field
              v-model="signupName"
              label="Full Name"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              :rules="nameRules"
              class="mb-3"
            />

            <v-text-field
              v-model="signupEmail"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              :rules="emailRules"
              :error-messages="authError"
              class="mb-3"
            />

            <v-text-field
              v-model="signupPassword"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              :rules="passwordRules"
              class="mb-3"
            />

            <v-text-field
              v-model="confirmPassword"
              label="Confirm Password"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              :rules="confirmPasswordRules"
              :error-messages="authError"
              class="mb-4"
            />

            <v-checkbox v-model="acceptTerms" :rules="termsRules" class="mb-3">
              <template v-slot:label>
                <div class="text-caption">
                  I accept the
                  <a href="#" @click.prevent="showTerms = true">Terms of Service</a>
                  and
                  <a href="#" @click.prevent="showPrivacy = true">Privacy Policy</a>
                </div>
              </template>
            </v-checkbox>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              class="mb-4 text-none"
            >
              Create Account
            </v-btn>
          </v-form>
        </v-tabs-window-item>
      </v-tabs-window>

      <!-- Divider -->
      <v-divider class="my-4">
        <template v-slot:default>
          <span class="text-medium-emphasis px-4">or</span>
        </template>
      </v-divider>

      <!-- Google Sign In -->
      <v-btn
        @click="handleGoogleSignIn"
        variant="outlined"
        color="primary"
        size="large"
        block
        :loading="loading"
        class="text-none"
        prepend-icon="mdi-google"
      >
        {{ isLogin ? 'Sign in' : 'Sign up' }} with Google
      </v-btn>
    </v-card-text>

    <!-- Close Button -->
    <v-card-actions class="justify-end pa-4">
      <v-btn @click="$emit('close')" variant="text" prepend-icon="mdi-close"> Cancel </v-btn>
    </v-card-actions>

    <!-- Forgot Password Dialog -->
    <v-dialog v-model="showForgotPassword" max-width="400">
      <v-card>
        <v-card-title>Reset Password</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="resetEmail"
            label="Email"
            type="email"
            variant="outlined"
            :rules="emailRules"
            class="mb-3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showForgotPassword = false" variant="text">Cancel</v-btn>
          <v-btn @click="handlePasswordReset" color="primary" :loading="loading">
            Send Reset Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" :timeout="4000" location="top">
      {{ successMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'

// Emits
const emit = defineEmits(['close', 'authenticated'])

// Reactive data
const activeTab = ref(0)
const loading = ref(false)
const authError = ref('')
const showPassword = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')

// Login form
const loginEmail = ref('')
const loginPassword = ref('')

// Signup form
const signupName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)

// Forgot password
const showForgotPassword = ref(false)
const resetEmail = ref('')

// Dialog states
const showTerms = ref(false)
const showPrivacy = ref(false)

// Computed
const isLogin = computed(() => activeTab.value === 0)

// Form refs
const loginForm = ref(null)
const signupForm = ref(null)

// Validation rules
const nameRules = [
  (v) => !!v || 'Name is required',
  (v) => (v && v.length >= 2) || 'Name must be at least 2 characters',
]

const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 6) || 'Password must be at least 6 characters',
]

const confirmPasswordRules = [
  (v) => !!v || 'Please confirm your password',
  (v) => v === signupPassword.value || 'Passwords do not match',
]

const termsRules = [(v) => !!v || 'You must accept the terms and conditions']

// Create user profile in Firestore
const createUserProfile = async (user, displayName = null) => {
  try {
    const userRef = doc(db, 'users', user.uid)
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || signupName.value,
        photoURL: user.photoURL || null,
        numberOfPlants: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}

// Handle email login
const handleEmailLogin = async () => {
  authError.value = ''

  const { valid } = await loginForm.value.validate()
  if (!valid) return

  loading.value = true

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail.value,
      loginPassword.value,
    )

    // Update user profile with login timestamp
    await createUserProfile(userCredential.user)

    showSuccess.value = true
    successMessage.value = 'Successfully signed in!'

    setTimeout(() => {
      emit('authenticated', userCredential.user)
    }, 1000)
  } catch (error) {
    console.error('Login error:', error)
    authError.value = getAuthErrorMessage(error.code)
  } finally {
    loading.value = false
  }
}

// Handle email signup
const handleEmailSignup = async () => {
  authError.value = ''

  const { valid } = await signupForm.value.validate()
  if (!valid) return

  loading.value = true

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      signupEmail.value,
      signupPassword.value,
    )

    // Update display name
    await updateProfile(userCredential.user, {
      displayName: signupName.value,
    })

    // Create user profile in Firestore
    await createUserProfile(userCredential.user, signupName.value)

    showSuccess.value = true
    successMessage.value = 'Account created successfully!'

    setTimeout(() => {
      emit('authenticated', userCredential.user)
    }, 1000)
  } catch (error) {
    console.error('Signup error:', error)
    authError.value = getAuthErrorMessage(error.code)
  } finally {
    loading.value = false
  }
}

// Handle Google Sign In
const handleGoogleSignIn = async () => {
  loading.value = true
  authError.value = ''

  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)

    // Create or update user profile
    await createUserProfile(userCredential.user)

    showSuccess.value = true
    successMessage.value = 'Successfully signed in with Google!'

    setTimeout(() => {
      emit('authenticated', userCredential.user)
    }, 1000)
  } catch (error) {
    console.error('Google sign in error:', error)
    if (error.code !== 'auth/popup-cancelled-by-user') {
      authError.value = 'Failed to sign in with Google. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Handle password reset
const handlePasswordReset = async () => {
  if (!resetEmail.value) {
    authError.value = 'Please enter your email address'
    return
  }

  loading.value = true

  try {
    await sendPasswordResetEmail(auth, resetEmail.value)
    showForgotPassword.value = false
    showSuccess.value = true
    successMessage.value = 'Password reset email sent!'
    resetEmail.value = ''
  } catch (error) {
    console.error('Password reset error:', error)
    authError.value = 'Failed to send password reset email. Please check your email address.'
  } finally {
    loading.value = false
  }
}

// Get user-friendly error messages
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/invalid-email':
      return 'Please enter a valid email address'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    default:
      return 'An error occurred. Please try again'
  }
}
</script>

<style scoped>
.auth-dialog {
  max-height: 90vh;
  overflow-y: auto;
}

.v-btn {
  border-radius: 8px !important;
}

.v-text-field {
  margin-bottom: 0;
}

.v-tab {
  text-transform: none !important;
}
</style>
