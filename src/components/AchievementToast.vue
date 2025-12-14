<template>
  <Teleport to="body">
    <Transition name="achievement-toast">
      <div v-if="visible" class="achievement-toast-overlay" @click.self="close">
        <div class="achievement-toast">
          <!-- Celebration particles -->
          <div class="celebration-particles">
            <span v-for="i in 12" :key="i" class="particle" :style="getParticleStyle(i)"></span>
          </div>

          <!-- Achievement content -->
          <div class="toast-content">
            <div class="achievement-badge" :style="{ background: badgeGradient }">
              <v-icon size="32" color="white">{{ achievement?.icon || 'mdi-trophy' }}</v-icon>
            </div>

            <div class="achievement-info">
              <div class="toast-label">Achievement Unlocked!</div>
              <h3 class="achievement-name">{{ achievement?.name || 'Achievement' }}</h3>
              <div class="xp-earned">
                <v-icon size="16" color="warning">mdi-star</v-icon>
                <span>+{{ achievement?.xpReward || 0 }} XP</span>
              </div>
            </div>
          </div>

          <!-- Close button -->
          <button class="close-btn" @click="close">
            <v-icon size="20">mdi-close</v-icon>
          </button>

          <!-- Progress bar (auto-close timer) -->
          <div class="progress-bar">
            <div class="progress-fill" :style="{ animationDuration: `${duration}ms` }"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  achievement: {
    type: Object,
    default: null,
  },
  duration: {
    type: Number,
    default: 5000,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'closed'])

const visible = ref(false)
let closeTimer = null

// Badge gradient based on achievement color
const badgeGradient = computed(() => {
  const colors = {
    success: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    primary: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    indigo: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    default: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  }
  return colors[props.achievement?.color] || colors.default
})

// Generate random particle styles
const getParticleStyle = (index) => {
  const angle = (index / 12) * 360
  const delay = Math.random() * 0.3
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`,
    '--color': index % 2 === 0 ? '#F59E0B' : '#22C55E',
  }
}

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('closed')
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const startTimer = () => {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    close()
  }, props.duration)
}

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      startTimer()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<style scoped>
.achievement-toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  pointer-events: none;
}

.achievement-toast {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  min-width: 320px;
  max-width: 400px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 60px rgba(245, 158, 11, 0.3);
  pointer-events: auto;
  overflow: hidden;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .achievement-toast {
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(24, 24, 27, 0.95) 100%);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 0 60px rgba(245, 158, 11, 0.2);
  }

  .achievement-name {
    color: #ffffff !important;
  }

  .toast-label {
    color: #f59e0b !important;
  }
}

/* Celebration particles */
.celebration-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color);
  border-radius: 50%;
  animation: particle-burst 0.8s ease-out var(--delay) forwards;
  opacity: 0;
}

@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(80px) scale(0);
    opacity: 0;
  }
}

/* Toast content */
.toast-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.achievement-badge {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

@keyframes badge-pop {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.toast-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #f59e0b;
  margin-bottom: 4px;
  animation: slide-up 0.4s ease-out 0.1s both;
}

.achievement-name {
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 6px;
  animation: slide-up 0.4s ease-out 0.2s both;
}

.xp-earned {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #d97706;
  animation: slide-up 0.4s ease-out 0.3s both;
}

@keyframes slide-up {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Close button */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #71717a;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #18181b;
}

/* Progress bar */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #22c55e 100%);
  animation: progress-shrink linear forwards;
  transform-origin: left;
}

@keyframes progress-shrink {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

/* Transition animations */
.achievement-toast-enter-active {
  animation: toast-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-toast-leave-active {
  animation: toast-leave 0.3s ease-in;
}

@keyframes toast-enter {
  0% {
    transform: translateY(-100px) scale(0.9);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes toast-leave {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
}
</style>
