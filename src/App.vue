<script setup>
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { listenForMessages, isMessagingSupported } from '@/services/notificationService'

const theme = useTheme()

// Notification snackbar state
const showNotificationSnackbar = ref(false)
const notificationTitle = ref('')
const notificationBody = ref('')
const notificationPlantId = ref(null)

// Listen for foreground messages
onMounted(() => {
  // Load dark mode preference from localStorage on app startup
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    const isDark = savedDarkMode === 'true'
    theme.global.name.value = isDark ? 'dark' : 'light'
  }

  if (isMessagingSupported()) {
    listenForMessages((payload) => {
      console.log('App received foreground message:', payload)

      // Extract notification data
      notificationTitle.value = payload.notification?.title || 'Plant Care Reminder 🌱'
      notificationBody.value = payload.notification?.body || 'Your plants need attention!'
      notificationPlantId.value = payload.data?.plantId || null

      // Show in-app snackbar
      showNotificationSnackbar.value = true
    })
  }
})

// Handle notification action
const handleNotificationClick = () => {
  showNotificationSnackbar.value = false
  if (notificationPlantId.value) {
    // Navigate to plant detail page
    window.location.href = `/app/plants/${notificationPlantId.value}`
  }
}
</script>

<template>
  <router-view />

  <!-- Foreground Notification Snackbar -->
  <v-snackbar
    v-model="showNotificationSnackbar"
    :timeout="8000"
    color="primary"
    location="top"
    multi-line
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3" size="large">mdi-flower</v-icon>
      <div>
        <div class="font-weight-bold">{{ notificationTitle }}</div>
        <div class="text-body-2">{{ notificationBody }}</div>
      </div>
    </div>
    <template v-slot:actions>
      <v-btn variant="text" @click="handleNotificationClick"> View </v-btn>
      <v-btn variant="text" @click="showNotificationSnackbar = false"> Close </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped></style>
