<template>
  <v-app class="modern-app">
    <!-- Main Content Area -->
    <v-main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Bottom Navigation (Mobile) - Modern Glass Effect -->
    <v-bottom-navigation
      v-if="$vuetify.display.mobile"
      v-model="activeTab"
      color="primary"
      grow
      class="mobile-nav"
    >
      <v-btn value="home" @click="$router.push('/app/home')">
        <v-icon>mdi-calendar-month</v-icon>
        <span class="nav-label">Calendar</span>
      </v-btn>

      <v-btn value="plants" @click="$router.push('/app/plants')">
        <v-icon>mdi-leaf</v-icon>
        <span class="nav-label">Plants</span>
      </v-btn>

      <v-btn value="rewards" @click="$router.push('/app/rewards')">
        <v-icon>mdi-trophy-outline</v-icon>
        <span class="nav-label">Rewards</span>
      </v-btn>

      <v-btn value="settings" @click="$router.push('/app/settings')">
        <v-icon>mdi-cog-outline</v-icon>
        <span class="nav-label">Settings</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Desktop Navigation Drawer - Modern Sidebar -->
    <v-navigation-drawer
      v-if="!$vuetify.display.mobile"
      permanent
      width="280"
      class="desktop-nav"
      :model-value="true"
    >
      <!-- App Header with Gradient -->
      <div class="nav-header">
        <div class="d-flex align-center">
          <div class="logo-container">
            <v-icon size="28" color="white">mdi-leaf</v-icon>
          </div>
          <div class="ml-3">
            <div class="app-title">Plant Care</div>
            <div class="app-subtitle">Smart Tracker</div>
          </div>
        </div>
      </div>

      <!-- User Profile Section -->
      <div class="user-section" v-if="user">
        <v-avatar size="44" class="user-avatar">
          <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" />
          <v-icon v-else size="28" color="primary">mdi-account</v-icon>
        </v-avatar>
        <div class="user-info">
          <div class="user-name">
            {{ user.displayName || 'Plant Lover' }}
          </div>
          <div class="user-stats">
            <v-icon size="14" class="mr-1">mdi-leaf</v-icon>
            {{ user.numberOfPlants || 0 }} plants
          </div>
        </div>
      </div>

      <!-- Navigation Items -->
      <v-list nav class="nav-list">
        <v-list-item
          prepend-icon="mdi-calendar-month"
          title="Calendar"
          value="home"
          @click="$router.push('/app/home')"
          :active="$route.name === 'home'"
          class="nav-item"
        />

        <v-list-item
          prepend-icon="mdi-leaf"
          title="My Plants"
          value="plants"
          @click="$router.push('/app/plants')"
          :active="$route.name === 'plants'"
          class="nav-item"
        />

        <v-list-item
          prepend-icon="mdi-trophy-outline"
          title="Rewards"
          value="rewards"
          @click="$router.push('/app/rewards')"
          :active="$route.name === 'rewards'"
          class="nav-item"
        />

        <v-list-item
          prepend-icon="mdi-cog-outline"
          title="Settings"
          value="settings"
          @click="$router.push('/app/settings')"
          :active="$route.name === 'settings'"
          class="nav-item"
        />
      </v-list>

      <v-spacer />

      <!-- Bottom Actions -->
      <div class="nav-footer">
        <v-btn
          @click="handleLogout"
          variant="tonal"
          color="error"
          block
          prepend-icon="mdi-logout"
          class="logout-btn"
        >
          Sign Out
        </v-btn>
      </div>
    </v-navigation-drawer>

    <!-- Floating Add Button -->
    <v-fab
      v-if="$route.name !== 'settings'"
      @click="showAddPlantDialog = true"
      icon="mdi-plus"
      color="primary"
      size="large"
      location="bottom end"
      class="fab-button"
    />

    <!-- Add Plant Dialog -->
    <AddPlantDialog v-model="showAddPlantDialog" @plant-added="onPlantAdded" />

    <!-- Logout Confirmation -->
    <v-dialog v-model="showLogoutDialog" max-width="300">
      <v-card>
        <v-card-title>Sign Out</v-card-title>
        <v-card-text> Are you sure you want to sign out? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showLogoutDialog = false" variant="text">Cancel</v-btn>
          <v-btn @click="confirmLogout" color="primary">Sign Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import AddPlantDialog from '@/components/AddPlantDialog.vue'

const router = useRouter()
const route = useRoute()

// Reactive data
const activeTab = ref('home')
const user = ref(null)
const showAddPlantDialog = ref(false)
const showLogoutDialog = ref(false)

// Update active tab based on route
activeTab.value = route.name || 'home'

// Listen for auth state changes and user profile updates
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser

      // Listen for user profile updates from Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data()
          user.value = { ...currentUser, ...userData }
        }
      })
    } else {
      user.value = null
      router.push('/')
    }
  })
})

// Handle logout
const handleLogout = () => {
  showLogoutDialog.value = true
}

const confirmLogout = async () => {
  try {
    await signOut(auth)
    showLogoutDialog.value = false
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Handle plant added
const onPlantAdded = () => {
  showAddPlantDialog.value = false
  // Optionally refresh plants list or show success message
}
</script>

<style scoped>
/* Page Transition */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Modern App Container */
.modern-app {
  background: rgb(var(--v-theme-background));
}

.main-content {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-background)) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
  min-height: 100vh;
}

/* Mobile Bottom Navigation */
.mobile-nav {
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  height: 68px !important;
}

.mobile-nav .v-btn {
  min-width: 64px !important;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 4px;
}

/* Desktop Navigation */
.desktop-nav {
  background: rgb(var(--v-theme-surface)) !important;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

.nav-header {
  padding: 24px 20px;
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.85) 100%
  );
}

.logo-container {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

/* User Section */
.user-section {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.user-avatar {
  background: rgba(var(--v-theme-primary), 0.1);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  display: flex;
  align-items: center;
  margin-top: 2px;
}

/* Navigation List */
.nav-list {
  padding: 12px 8px;
  flex-grow: 1;
}

.nav-item {
  margin-bottom: 4px;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
}

.nav-item:hover {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

.nav-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12) !important;
}

.nav-item.v-list-item--active .v-list-item__prepend .v-icon {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Footer */
.nav-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.logout-btn {
  font-weight: 500 !important;
}

/* FAB Button */
.fab-button {
  margin-bottom: 84px;
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.35) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.fab-button:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(var(--v-theme-primary), 0.45) !important;
}

@media (min-width: 960px) {
  .fab-button {
    margin-bottom: 24px;
  }
}

/* Logout Dialog */
.logout-dialog-card {
  border-radius: 20px !important;
}
</style>
