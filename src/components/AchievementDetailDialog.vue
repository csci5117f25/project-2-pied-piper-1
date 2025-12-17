<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="450"
  >
    <v-card v-if="achievement">
      <!-- Header with gradient background -->
      <div class="achievement-header" :class="`achievement-header--${achievement.color}`">
        <div class="header-icon-bg">
          <v-icon size="64" color="white">{{ achievement.icon }}</v-icon>
        </div>
      </div>

      <v-card-text class="pa-6">
        <!-- Achievement Name -->
        <h2 class="text-h5 font-weight-bold mb-2 text-center">{{ achievement.name }}</h2>

        <!-- Status Badge -->
        <div class="text-center mb-4">
          <v-chip :color="achievement.unlocked ? 'success' : 'grey'" variant="flat" size="small">
            <v-icon left size="16">{{
              achievement.unlocked ? 'mdi-check-circle' : 'mdi-lock'
            }}</v-icon>
            {{ achievement.unlocked ? 'Unlocked' : 'Locked' }}
          </v-chip>
        </div>

        <!-- Description -->
        <p class="text-body-1 text-center mb-4" style="color: rgba(var(--v-theme-on-surface), 0.8)">
          {{ achievement.description }}
        </p>

        <!-- Progress Bar (if not unlocked) -->
        <div v-if="!achievement.unlocked" class="progress-section mb-4">
          <div class="progress-header mb-2">
            <span class="text-caption">Progress</span>
            <span class="text-caption font-weight-bold"
              >{{ achievement.progress }} / {{ achievement.target }}</span
            >
          </div>
          <v-progress-linear
            :model-value="(achievement.progress / achievement.target) * 100"
            :color="achievement.color"
            height="8"
            rounded
          ></v-progress-linear>
        </div>

        <!-- Unlocked Date (if unlocked) -->
        <div v-if="achievement.unlocked && achievement.unlockedDate" class="unlock-info mb-4">
          <div class="unlock-date">
            <v-icon size="16" class="mr-1">mdi-calendar-check</v-icon>
            <span class="text-caption">Unlocked on {{ formatDate(achievement.unlockedDate) }}</span>
          </div>
        </div>

        <!-- XP Reward -->
        <div class="xp-reward-box">
          <v-icon color="warning" size="24">mdi-star</v-icon>
          <span class="text-h6 font-weight-bold ml-2">{{ achievement.xpReward }} XP</span>
          <span class="text-caption ml-2" style="color: rgba(var(--v-theme-on-surface), 0.6)"
            >Reward</span
          >
        </div>
      </v-card-text>

      <!-- Close Button -->
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="$emit('update:modelValue', false)">
          Close
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

// Format date for display
const formatDate = (date) => {
  if (!date) return ''

  let d = date
  if (date.toDate) {
    d = date.toDate()
  } else if (typeof date === 'string') {
    d = new Date(date)
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.achievement-header {
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.achievement-header--success {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
}

.achievement-header--primary {
  background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
}

.achievement-header--warning {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
}

.achievement-header--error {
  background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
}

.achievement-header--info {
  background: linear-gradient(135deg, #00bcd4 0%, #4dd0e1 100%);
}

.header-icon-bg {
  position: relative;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.progress-section {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unlock-info {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: rgba(var(--v-theme-success), 0.1);
  border-radius: 8px;
}

.unlock-date {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.xp-reward-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-warning), 0.1),
    rgba(var(--v-theme-warning), 0.05)
  );
  border-radius: 12px;
  border: 2px solid rgba(var(--v-theme-warning), 0.3);
}
</style>
