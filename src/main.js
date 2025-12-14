import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Global styles
import './styles/global.css'

// Firebase
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './firebase'

// Modern color palette inspired by DeepMind/OpenAI
const modernColors = {
  // Primary emerald green palette
  primary: '#059669', // Emerald-600 - main brand
  'primary-light': '#10B981', // Emerald-500 - hover states
  'primary-dark': '#047857', // Emerald-700 - pressed states

  // Secondary sage/mint
  secondary: '#6EE7B7', // Emerald-300 - accents

  // Semantic colors
  success: '#22C55E', // Green-500
  warning: '#F59E0B', // Amber-500
  error: '#EF4444', // Red-500
  info: '#3B82F6', // Blue-500

  // Surface colors for light mode
  background: '#FAFAFA',
  surface: '#FFFFFF',
  'surface-variant': '#F1F5F9',
  'on-surface': '#0F172A',
  'on-surface-light': '#64748B',
}

const darkColors = {
  primary: '#10B981',
  'primary-light': '#34D399',
  'primary-dark': '#059669',
  secondary: '#6EE7B7',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#0F172A',
  surface: '#1E293B',
  'surface-variant': '#334155',
  'on-surface': '#F8FAFC',
  'on-surface-light': '#94A3B8',
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: modernColors,
      },
      dark: {
        dark: true,
        colors: darkColors,
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
  },
})

const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
})

app.mount('#app')
