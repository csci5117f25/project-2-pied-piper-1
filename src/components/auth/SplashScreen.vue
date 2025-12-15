<template>
  <v-app class="splash-app">
    <v-main>
      <div class="splash-container">
        <!-- Animated Background Elements -->
        <div class="bg-decoration">
          <div class="floating-leaf leaf-1"></div>
          <div class="floating-leaf leaf-2"></div>
          <div class="floating-leaf leaf-3"></div>
          <div class="glow-orb"></div>
        </div>

        <v-container class="content-container">
          <v-row justify="center" align="center" class="fill-height">
            <v-col cols="12" sm="10" md="8" lg="6" xl="5">
              <!-- Hero Section -->
              <div class="hero-section">
                <!-- Logo -->
                <div class="logo-wrapper">
                  <div class="logo-glow"></div>
                  <div class="logo-circle">
                    <v-icon size="56" color="white">mdi-leaf</v-icon>
                  </div>
                </div>

                <!-- Branding -->
                <h1 class="hero-title">Plant Care <span class="gradient-text">Tracker</span></h1>
                <p class="hero-subtitle">Your intelligent companion for thriving plants</p>

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <v-btn
                    @click="showAuthDialog = true"
                    color="primary"
                    size="x-large"
                    block
                    class="primary-btn mb-4"
                    prepend-icon="mdi-rocket-launch"
                  >
                    Get Started
                  </v-btn>

                  <v-btn
                    @click="showLearnMore = !showLearnMore"
                    variant="outlined"
                    size="large"
                    block
                    class="secondary-btn"
                    :append-icon="showLearnMore ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  >
                    Learn More
                  </v-btn>
                </div>

                <!-- Features Card -->
                <v-expand-transition>
                  <div v-if="showLearnMore" class="features-card">
                    <div class="features-header">
                      <span>Why choose us?</span>
                    </div>
                    <div class="features-grid">
                      <div class="feature-item">
                        <div class="feature-icon" style="--accent: #10b981">
                          <v-icon size="24">mdi-bell-ring</v-icon>
                        </div>
                        <div class="feature-text">
                          <strong>Smart Reminders</strong>
                          <span>Never miss a watering day</span>
                        </div>
                      </div>
                      <div class="feature-item">
                        <div class="feature-icon" style="--accent: #3b82f6">
                          <v-icon size="24">mdi-brain</v-icon>
                        </div>
                        <div class="feature-text">
                          <strong>AI Identification</strong>
                          <span>Identify any plant instantly</span>
                        </div>
                      </div>
                      <div class="feature-item">
                        <div class="feature-icon" style="--accent: #f59e0b">
                          <v-icon size="24">mdi-weather-sunny</v-icon>
                        </div>
                        <div class="feature-text">
                          <strong>Weather Sync</strong>
                          <span>Care tips based on forecast</span>
                        </div>
                      </div>
                      <div class="feature-item">
                        <div class="feature-icon" style="--accent: #8b5cf6">
                          <v-icon size="24">mdi-trophy</v-icon>
                        </div>
                        <div class="feature-text">
                          <strong>Earn Rewards</strong>
                          <span>Gamified plant care journey</span>
                        </div>
                      </div>
                    </div>
                    <v-btn
                      @click="showAuthDialog = true"
                      color="primary"
                      variant="tonal"
                      block
                      class="mt-4"
                      prepend-icon="mdi-arrow-right"
                    >
                      Start Your Journey
                    </v-btn>
                  </div>
                </v-expand-transition>
              </div>
            </v-col>
          </v-row>
        </v-container>

        <!-- Auth Dialog -->
        <v-dialog v-model="showAuthDialog" max-width="480" class="auth-dialog">
          <AuthDialog @close="showAuthDialog = false" @authenticated="onAuthenticated" />
        </v-dialog>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthDialog from '@/components/auth/AuthDialog.vue'

const router = useRouter()

const showAuthDialog = ref(false)
const showLearnMore = ref(false)

const onAuthenticated = () => {
  showAuthDialog.value = false
  router.push('/onboarding')
}
</script>

<style scoped>
.splash-app {
  background: url('/wallpaper.jpg') center/cover no-repeat fixed;
}

.splash-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.content-container {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.fill-height {
  min-height: 100%;
}

/* Background Decorations */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-leaf {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  opacity: 0.5;
  filter: blur(60px);
}

.leaf-1 {
  top: 10%;
  left: 10%;
  background: rgba(16, 185, 129, 0.3);
  animation: float 8s ease-in-out infinite;
}

.leaf-2 {
  top: 60%;
  right: 15%;
  background: rgba(110, 231, 183, 0.25);
  animation: float 10s ease-in-out infinite reverse;
}

.leaf-3 {
  bottom: 20%;
  left: 30%;
  background: rgba(5, 150, 105, 0.2);
  animation: float 12s ease-in-out infinite;
}

.glow-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.05);
  }
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 40px 0;
}

/* Logo */
.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 32px;
}

.logo-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
  animation: pulse-glow 3s ease-in-out infinite;
}

.logo-circle {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 28px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(5, 150, 105, 0.3);
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* Typography */
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 40px;
  font-weight: 400;
}

/* Buttons */
.action-buttons {
  max-width: 320px;
  margin: 0 auto;
}

.primary-btn {
  height: 56px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  box-shadow: 0 12px 24px rgba(5, 150, 105, 0.25) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.primary-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 16px 32px rgba(5, 150, 105, 0.35) !important;
}

.secondary-btn {
  height: 48px !important;
  font-weight: 500 !important;
  border-color: rgba(15, 23, 42, 0.15) !important;
  color: #334155 !important;
}

/* Features Card */
.features-card {
  margin-top: 32px;
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.features-header {
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 20px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon .v-icon {
  color: var(--accent);
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-text strong {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.feature-text span {
  font-size: 0.75rem;
  color: #64748b;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .hero-section {
    padding: 24px 0;
  }

  .logo-circle {
    width: 80px;
    height: 80px;
    border-radius: 20px;
  }

  .logo-circle .v-icon {
    font-size: 40px !important;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-item {
    padding: 8px 0;
  }
}
</style>
