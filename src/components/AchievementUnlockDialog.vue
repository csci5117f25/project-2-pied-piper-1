<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card class="achievement-unlock-card">
      <!-- Confetti particles -->
      <div class="confetti-container">
        <div v-for="i in 30" :key="i" class="confetti-particle" :style="getParticleStyle(i)"></div>
      </div>

      <!-- Achievement Unlock Content -->
      <v-card-text class="achievement-content">
        <!-- Celebration Icon -->
        <div class="celebration-icon">
          <v-icon size="80" color="white">mdi-star-circle</v-icon>
        </div>

        <!-- Achievement Unlocked Text -->
        <div class="unlock-text">
          <h2 class="text-h4 font-weight-bold mb-2">ACHIEVEMENT UNLOCKED!</h2>
          <p class="text-subtitle-1 mb-6">You've reached a new milestone!</p>
        </div>

        <!-- Achievement Badge -->
        <div class="achievement-badge">
          <div class="badge-glow"></div>
          <div class="badge-icon-wrapper">
            <v-icon :size="72" class="badge-icon" :color="achievement?.color || 'success'">
              {{ achievement?.icon || 'mdi-trophy' }}
            </v-icon>
          </div>
          <div class="badge-details">
            <h3 class="achievement-name">{{ achievement?.name || 'Achievement' }}</h3>
            <p class="achievement-description">{{ achievement?.description || '' }}</p>
            <div class="xp-reward">
              <v-icon size="20" color="warning">mdi-star</v-icon>
              <span>+{{ achievement?.xpReward || 0 }} XP</span>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div class="success-message">
          <p class="text-body-1">Amazing work! Keep up the great plant care!</p>
        </div>
      </v-card-text>

      <!-- Close Button -->
      <v-card-actions class="justify-center pb-6">
        <v-btn
          color="white"
          variant="elevated"
          size="large"
          rounded="pill"
          @click="$emit('update:modelValue', false)"
          class="close-btn"
        >
          <v-icon left>mdi-check</v-icon>
          Awesome!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  achievement: {
    type: Object,
    default: null,
  },
})

defineEmits(['update:modelValue'])

// Generate random particle styles
const getParticleStyle = (index) => {
  const colors = [
    '#FFD700',
    '#FFA500',
    '#FFFF00',
    '#FFB900',
    '#FFC300',
    '#FFEA00',
    '#FFD32D',
    '#FFE55C',
  ]
  const angle = (index / 30) * 360
  const distance = 150 + Math.random() * 100
  const duration = 1.5 + Math.random() * 1.5
  const delay = Math.random() * 0.5

  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
    background: colors[index % colors.length],
  }
}
</script>

<style scoped>
.achievement-unlock-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  overflow: hidden;
  position: relative;
}

.confetti-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.confetti-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: confetti-burst var(--duration) ease-out var(--delay) forwards;
  opacity: 0;
}

@keyframes confetti-burst {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(calc(var(--angle))) translateY(var(--distance));
    opacity: 0;
  }
}

.achievement-content {
  position: relative;
  z-index: 2;
  padding: 48px 24px 24px;
  text-align: center;
}

.celebration-icon {
  animation: icon-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  margin-bottom: 24px;
}

@keyframes icon-pop {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.unlock-text {
  animation: slide-up 0.8s ease-out 0.2s backwards;
}

.unlock-text h2 {
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

@keyframes slide-up {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.achievement-badge {
  position: relative;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 32px 24px;
  margin: 32px auto;
  max-width: 400px;
  animation: badge-appear 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.4s backwards;
}

@keyframes badge-appear {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.badge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 120%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  animation: pulse-glow 2s ease-in-out 1s infinite;
  pointer-events: none;
}

@keyframes pulse-glow {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
}

.badge-icon-wrapper {
  margin-bottom: 16px;
  animation: rotate-float 1s ease-out 0.6s backwards;
}

.badge-icon {
  filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.8));
  animation: icon-glow 2s ease-in-out 1.2s infinite;
}

@keyframes rotate-float {
  from {
    transform: rotate(-180deg) translateY(-50px);
    opacity: 0;
  }
  to {
    transform: rotate(0deg) translateY(0);
    opacity: 1;
  }
}

@keyframes icon-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 24px rgba(255, 215, 0, 1));
  }
}

.badge-details {
  animation: slide-up 0.8s ease-out 0.8s backwards;
}

.achievement-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.achievement-description {
  font-size: 0.95rem;
  opacity: 0.95;
  margin-bottom: 16px;
  line-height: 1.4;
}

.xp-reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 215, 0, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.success-message {
  animation: slide-up 0.8s ease-out 1s backwards;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
}

.close-btn {
  animation: slide-up 0.8s ease-out 1.2s backwards;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  font-weight: 600;
  padding: 8px 32px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .achievement-badge {
    padding: 24px 16px;
  }

  .achievement-name {
    font-size: 1.25rem;
  }
}
</style>
