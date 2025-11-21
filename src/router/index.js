import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

// Lazy load components
const SplashScreen = () => import('@/components/auth/SplashScreen.vue')
const OnboardingFlow = () => import('@/views/OnboardingFlow.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const HomePage = () => import('@/views/HomePage.vue')
const MyPlantsPage = () => import('@/views/MyPlantsPage.vue')
const PlantDetailPage = () => import('@/views/PlantDetailPage.vue')
const RewardsPage = () => import('@/views/RewardsPage.vue')
const SettingsPage = () => import('@/views/SettingsPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'splash',
      component: SplashScreen,
      meta: { requiresGuest: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingFlow,
      meta: { requiresAuth: true },
    },
    {
      path: '/app',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/app/home',
        },
        {
          path: 'home',
          name: 'home',
          component: HomePage,
        },
        {
          path: 'plants',
          name: 'plants',
          component: MyPlantsPage,
        },
        {
          path: 'plants/:id',
          name: 'plant-detail',
          component: PlantDetailPage,
        },
        {
          path: 'rewards',
          name: 'rewards',
          component: RewardsPage,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsPage,
        },
      ],
    },
  ],
})

// Global auth state
let isAuthenticated = false
let isReady = false

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  isAuthenticated = !!user
  isReady = true
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  // Wait for Firebase Auth to initialize
  if (!isReady) {
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe()
        resolve()
      })
    })
    isReady = true
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresAuth && !isAuthenticated) {
    // Redirect to splash if trying to access protected route while not authenticated
    next('/')
  } else if (requiresGuest && isAuthenticated) {
    // Check if user needs onboarding
    try {
      const user = auth.currentUser
      if (user) {
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists() || !userDoc.data().onboardingCompleted) {
          // New user or hasn't completed onboarding
          next('/onboarding')
          return
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
    
    // Redirect to main app if authenticated and onboarding completed
    next('/app/home')
  } else {
    next()
  }
})

export default router
