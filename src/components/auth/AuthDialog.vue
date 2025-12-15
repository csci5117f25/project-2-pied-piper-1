<template>
  <v-card class="auth-dialog">
    <!-- Header with gradient accent -->
    <div class="auth-header">
      <div class="header-accent"></div>
      <div class="header-content">
        <div class="logo-mini">
          <v-icon size="32" color="white">mdi-leaf</v-icon>
        </div>
        <h2 class="auth-title">{{ isLogin ? 'Welcome back' : 'Create account' }}</h2>
        <p class="auth-subtitle">
          {{
            isLogin
              ? 'Sign in to continue caring for your plants'
              : 'Start your plant care journey today'
          }}
        </p>
      </div>
    </div>

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
        size="large"
        block
        :loading="loading"
        class="google-btn"
      >
        <template v-slot:prepend>
          <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </template>
        Continue with Google
      </v-btn>
    </v-card-text>

    <!-- Close Button -->
    <v-card-actions class="auth-footer">
      <v-btn @click="$emit('close')" variant="text" color="error" size="small">
        <v-icon size="18" class="mr-1">mdi-close</v-icon>
        Cancel
      </v-btn>
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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
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
const createUserProfile = async (user, displayName = null, isNewUser = false) => {
  try {
    const userRef = doc(db, 'users', user.uid)
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || signupName.value,
      photoURL: user.photoURL || null,
      numberOfPlants: 0,
      lastLogin: serverTimestamp(),
      xp: 0,
      level: 1,
      tasksCompletedToday: [],
      lastTaskResetDate: serverTimestamp(),
    }

    // Only set onboardingCompleted for new users
    if (isNewUser) {
      profileData.onboardingCompleted = false
      profileData.createdAt = serverTimestamp()
    }

    await setDoc(userRef, profileData, { merge: true })
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
    await createUserProfile(userCredential.user, null, false)

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
    await createUserProfile(userCredential.user, signupName.value, true)

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

    // Create or update user profile (check if it's a new user)
    const userRef = doc(db, 'users', userCredential.user.uid)
    const userDoc = await getDoc(userRef)
    const isNewUser = !userDoc.exists()

    await createUserProfile(userCredential.user, null, isNewUser)

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
  border-radius: 24px !important;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

/* Header */
.auth-header {
  position: relative;
  padding: 32px 24px 24px;
  text-align: center;
  overflow: hidden;
}

.header-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%);
}

.header-content {
  position: relative;
}

.logo-mini {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(5, 150, 105, 0.25);
}

.auth-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

/* Tabs */
.v-tab {
  text-transform: none !important;
  font-weight: 500 !important;
  font-size: 0.9rem !important;
}

/* Buttons */
.v-btn {
  font-weight: 600 !important;
}

.google-btn {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-weight: 500 !important;
  height: 48px !important;
}

.google-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

.google-icon {
  margin-right: 8px;
}

/* Footer */
.auth-footer {
  justify-content: center;
  padding: 16px 24px 24px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

/* Form Inputs */
.v-text-field {
  margin-bottom: 0;
}

:deep(.v-field) {
  border-radius: 12px !important;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.12;
}

/* Links */
a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 500;
}

a:hover {
  text-decoration: underline;
}
</style>
