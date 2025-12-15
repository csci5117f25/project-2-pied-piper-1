<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card class="level-up-card">
      <!-- Confetti particles -->
      <div class="confetti-container">
        <div v-for="i in 30" :key="i" class="confetti-particle" :style="getParticleStyle(i)"></div>
      </div>

      <!-- Level Up Content -->
      <v-card-text class="level-up-content">
        <!-- Celebration Icon -->
        <div class="celebration-icon">
          <v-icon size="80" color="white">mdi-trophy-variant</v-icon>
        </div>

        <!-- Level Up Text -->
        <div class="level-up-text">
          <h2 class="text-h4 font-weight-bold mb-2">LEVEL UP!</h2>
          <p class="text-subtitle-1 mb-6">Congratulations on your progress!</p>
        </div>

        <!-- Level Badge Transition -->
        <div class="level-badges">
          <!-- Old Level -->
          <div class="level-badge old-level">
            <v-icon :size="48" class="badge-icon">{{
              levelUpData?.oldLevelInfo?.icon || 'mdi-seed'
            }}</v-icon>
            <div class="badge-text">
              <div class="level-number">Level {{ levelUpData?.oldLevel || 1 }}</div>
              <div class="level-name">{{ levelUpData?.oldLevelInfo?.name || 'Seed Starter' }}</div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="level-arrow">
            <v-icon size="40" color="white">mdi-arrow-right</v-icon>
          </div>

          <!-- New Level -->
          <div class="level-badge new-level">
            <v-icon :size="48" class="badge-icon glow">{{
              levelUpData?.newLevelInfo?.icon || 'mdi-sprout'
            }}</v-icon>
            <div class="badge-text">
              <div class="level-number">Level {{ levelUpData?.newLevel || 2 }}</div>
              <div class="level-name">
                {{ levelUpData?.newLevelInfo?.name || 'Sprout Caretaker' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Message -->
        <div class="success-message">
          <p class="text-body-1">
            You've unlocked <strong>{{ levelUpData?.newLevelInfo?.name }}</strong
            >!
          </p>
          <p class="text-body-2 mt-2">Keep caring for your plants to reach even greater heights!</p>
        </div>
      </v-card-text>

      <!-- Close Button -->
      <v-card-actions class="justify-center pb-4">
        <v-btn
          color="white"
          variant="elevated"
          size="large"
          rounded="pill"
          @click="$emit('update:modelValue', false)"
          class="close-btn"
        >
          <v-icon left>mdi-check</v-icon>
          Continue
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
  levelUpData: {
    type: Object,
    default: null,
  },
})

defineEmits(['update:modelValue'])

// Generate random particle styles
const getParticleStyle = (index) => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
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
.level-up-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.level-up-content {
  position: relative;
  z-index: 2;
  padding: 32px 24px 16px;
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

.level-up-text {
  animation: slide-up 0.8s ease-out 0.2s backwards;
}

.level-up-text h2 {
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

.level-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 32px 0;
  flex-wrap: wrap;
}

.level-badge {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.old-level {
  animation: fade-out-scale 0.8s ease-out 0.4s backwards;
  opacity: 0.7;
}

.new-level {
  animation: scale-bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.6s backwards;
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.3);
}

@keyframes fade-out-scale {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

@keyframes scale-bounce {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.15) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.badge-icon {
  animation: rotate-glow 0.8s ease-out 0.8s backwards;
}

.badge-icon.glow {
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
  animation:
    rotate-glow 1s ease-out 0.8s backwards,
    pulse-glow 2s ease-in-out 1.5s infinite;
}

@keyframes rotate-glow {
  from {
    transform: rotate(-180deg) scale(0);
    filter: drop-shadow(0 0 0 rgba(255, 255, 255, 0));
  }
  to {
    transform: rotate(0deg) scale(1);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 1));
  }
}

.badge-text {
  text-align: center;
}

.level-number {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.level-name {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

.level-arrow {
  animation: arrow-slide 0.8s ease-out 0.5s backwards;
}

@keyframes arrow-slide {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.success-message {
  animation: slide-up 0.8s ease-out 1s backwards;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.success-message strong {
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  .level-badges {
    flex-direction: column;
    gap: 16px;
  }

  .level-arrow {
    transform: rotate(90deg);
  }

  .level-badge {
    min-width: 200px;
  }
}
</style>
