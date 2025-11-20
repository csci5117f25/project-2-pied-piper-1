<template>
  <v-app>
    <!-- Main Content Area -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Bottom Navigation (Mobile) / Side Navigation (Desktop) -->
    <v-bottom-navigation v-if="$vuetify.display.mobile" v-model="activeTab" color="primary" grow>
      <v-btn value="home" @click="$router.push('/app/home')">
        <v-icon>mdi-calendar</v-icon>
        <span>Calendar</span>
      </v-btn>

      <v-btn value="plants" @click="$router.push('/app/plants')">
        <v-icon>mdi-sprout</v-icon>
        <span>My Plants</span>
      </v-btn>

      <v-btn value="rewards" @click="$router.push('/app/rewards')">
        <v-icon>mdi-trophy</v-icon>
        <span>Rewards</span>
      </v-btn>

      <v-btn value="settings" @click="$router.push('/app/settings')">
        <v-icon>mdi-cog</v-icon>
        <span>Settings</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Desktop Navigation Drawer -->
    <v-navigation-drawer v-if="!$vuetify.display.mobile" permanent width="260" class="desktop-nav" :model-value="true">
      <!-- App Header -->
      <div class="nav-header pa-4">
        <div class="d-flex align-center">
          <v-icon size="32" color="primary" class="mr-3"> mdi-sprout </v-icon>
          <div>
            <div class="text-h6 font-weight-bold">Plant Care</div>
            <div class="text-caption text-medium-emphasis">Tracker</div>
          </div>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- User Profile Section -->
      <div class="user-profile pa-4" v-if="user">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-2 font-weight-medium">
              {{ user.displayName || user.email }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ user.numberOfPlants || 0 }} plants
            </div>
          </div>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- Navigation Items -->
      <v-list nav class="flex-grow-1">
        <v-list-item
          prepend-icon="mdi-calendar"
          title="Calendar"
          value="home"
          @click="$router.push('/app/home')"
          :active="$route.name === 'home'"
        />

        <v-list-item
          prepend-icon="mdi-sprout"
          title="My Plants"
          value="plants"
          @click="$router.push('/app/plants')"
          :active="$route.name === 'plants'"
        />

        <v-list-item
          prepend-icon="mdi-trophy"
          title="Rewards"
          value="rewards"
          @click="$router.push('/app/rewards')"
          :active="$route.name === 'rewards'"
        />

        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          value="settings"
          @click="$router.push('/app/settings')"
          :active="$route.name === 'settings'"
        />
      </v-list>

      <!-- Bottom Actions -->
      <div class="nav-footer pa-4">
        <v-btn
          @click="handleLogout"
          variant="outlined"
          size="small"
          block
          prepend-icon="mdi-logout"
          class="text-none"
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
.desktop-nav {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.nav-header {
  background: rgba(var(--v-theme-primary), 0.05);
}

.user-profile {
  background: rgba(var(--v-theme-surface), 0.5);
}

.nav-footer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.fab-button {
  margin-bottom: 80px; /* Account for mobile bottom navigation */
}

@media (min-width: 960px) {
  .fab-button {
    margin-bottom: 24px;
  }
}

.v-bottom-navigation {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
