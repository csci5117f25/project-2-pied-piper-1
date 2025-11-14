<template>
  <v-app>
    <v-main>
      <v-container fluid class="splash-container">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4">
            <!-- App Logo and Branding -->
            <div class="text-center mb-8">
              <v-icon size="120" color="primary" class="mb-4"> mdi-sprout </v-icon>
              <h1 class="text-h3 font-weight-bold text-primary mb-2">Plant Care Tracker</h1>
              <p class="text-h6 text-medium-emphasis">Your smart companion for healthy plants</p>
            </div>

            <!-- Action Buttons -->
            <div class="text-center">
              <v-btn
                @click="showAuthDialog = true"
                color="primary"
                size="x-large"
                block
                class="mb-4 text-none"
                prepend-icon="mdi-login"
              >
                Login / Sign Up
              </v-btn>

              <v-btn
                @click="showLearnMore = true"
                variant="outlined"
                color="primary"
                size="large"
                block
                class="text-none"
                prepend-icon="mdi-information"
              >
                Learn More
              </v-btn>
            </div>

            <!-- Features Preview (shown when Learn More is clicked) -->
            <v-expand-transition>
              <v-card v-if="showLearnMore" class="mt-6" elevation="2">
                <v-card-title class="text-center">
                  <v-icon color="primary" class="mr-2">mdi-heart</v-icon>
                  Why Plant Care Tracker?
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <div class="feature-item">
                        <v-icon color="success" class="mr-2">mdi-calendar-check</v-icon>
                        <span>Smart watering reminders</span>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="feature-item">
                        <v-icon color="info" class="mr-2">mdi-camera</v-icon>
                        <span>Photo progress tracking</span>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="feature-item">
                        <v-icon color="warning" class="mr-2">mdi-weather-sunny</v-icon>
                        <span>Weather-based care tips</span>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <div class="feature-item">
                        <v-icon color="purple" class="mr-2">mdi-trophy</v-icon>
                        <span>Achievement rewards</span>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions class="justify-center pb-4">
                  <v-btn
                    @click="showAuthDialog = true"
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-rocket-launch"
                  >
                    Get Started Now
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-expand-transition>
          </v-col>
        </v-row>

        <!-- Authentication Dialog -->
        <v-dialog v-model="showAuthDialog" max-width="500" persistent>
          <AuthDialog @close="showAuthDialog = false" @authenticated="onAuthenticated" />
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthDialog from '@/components/auth/AuthDialog.vue'

const router = useRouter()

// Reactive data
const showAuthDialog = ref(false)
const showLearnMore = ref(false)

// Handle successful authentication
const onAuthenticated = () => {
  showAuthDialog.value = false
  // Redirect to onboarding for first-time users or main app
  router.push('/onboarding')
}
</script>

<style scoped>
.splash-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

.splash-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 195, 74, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(205, 220, 57, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.v-btn {
  border-radius: 12px !important;
}

.fill-height {
  min-height: 100vh;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .text-h3 {
    font-size: 2rem !important;
  }

  .text-h6 {
    font-size: 1.1rem !important;
  }
}
</style>
