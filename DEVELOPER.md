# Plant Care Tracker - Developer Guide

## 🌱 Project Overview

Plant Care Tracker is a comprehensive plant care management application built with Vue.js, Firebase, VueFire, and Vuetify Material Design. The app helps users track their plant collection, manage watering schedules, and receive smart reminders based on real weather data.

## 🏗️ Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **UI Framework**: Vuetify (Material Design)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Database Integration**: VueFire for reactive Firebase integration
- **Routing**: Vue Router
- **Build Tool**: Vite
- **PWA**: Vite PWA plugin for offline support and installability
- **Weather API**: OpenWeatherMap API
- **Styling**: Material Design with custom plant-themed colors

## 🎯 Key Features

### Core Features (MVP)

- ✅ User authentication (email/password + Google OAuth)
- ✅ Plant CRUD operations (Create, Read, Update, Delete)
- ✅ Watering schedule management
- ✅ Calendar view with daily plant tasks
- ✅ Photo documentation via device camera
- ✅ Responsive mobile-first design

### Enhanced Features

- 📱 **Device Integrations**: Camera API for plant photos, Geolocation for weather data
- 🔔 **PWA Features**: Push notifications, Add to home screen, Offline functionality
- 🏆 **Gamification**: Static achievement badges for plant care milestones
- 🌤️ **Weather Integration**: OpenWeatherMap API for location-based watering recommendations

## 📁 Project Structure

```
project-2-pied-piper-1/
├── public/                    # Static assets
│   ├── icon-192x192.png      # PWA icons
│   └── icon-512x512.png
├── src/
│   ├── components/           # Reusable Vue components
│   │   ├── auth/            # Authentication related components
│   │   ├── plant/           # Plant management components
│   │   └── ui/              # General UI components
│   ├── views/               # Route-level components (pages)
│   ├── stores/              # State management (if needed)
│   ├── utils/               # Helper functions and utilities
│   ├── router/              # Vue Router configuration
│   ├── firebase.js          # Firebase configuration
│   ├── main.js              # App entry point
│   └── App.vue              # Root component
├── Mockup/                  # Design mockups and wireframes
├── DEVELOPER.md            # This file
├── README.md              # Project documentation
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git** for version control
- **Firebase Project** (instructions below)

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/csci5117f25/project-2-pied-piper-1.git
   cd project-2-pied-piper-1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase** (see Firebase Setup section below)

4. **Configure environment variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env.local

   # Edit .env.local with your Firebase and OpenWeatherMap credentials
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**: http://localhost:5173

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" and follow the setup wizard
3. Enable Google Analytics (recommended)

### 2. Enable Services

Navigate to your Firebase project and enable:

- **Authentication**: Enable Email/Password and Google providers
- **Firestore Database**: Create in production mode, set up security rules
- **Storage**: Enable for plant photo uploads

### 3. Get Configuration

1. Go to Project Settings → General → Your apps
2. Add a web app and copy the Firebase config object
3. Replace the placeholder config in `src/firebase.js`

### 4. Security Rules

**Firestore Rules** (Database → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Plants belong to users
    match /plants/{plantId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Reminders belong to users
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Achievements belong to users
    match /achievements/{achievementId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

**Storage Rules** (Storage → Rules):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/plants/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌐 Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenWeatherMap API
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

## 🌊 Git Workflow & Team Development

### Branch Strategy

```
main                    # Production branch
├── dev                # Development/integration branch
│   ├── feature/auth            # Authentication features
│   ├── feature/plant-crud      # Plant management features
│   ├── feature/calendar        # Calendar and reminders
│   ├── feature/camera          # Camera integration
│   ├── feature/pwa             # PWA features
│   └── feature/weather         # Weather API integration
└── hotfix/             # Critical production fixes
```

### Development Workflow

1. **Create a feature branch from `dev`**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the coding standards
   - Test your changes locally
   - Commit frequently with descriptive messages

3. **Commit conventions**

   ```bash
   git commit -m "feat: add plant photo capture functionality"
   git commit -m "fix: resolve calendar date display issue"
   git commit -m "docs: update Firebase setup instructions"
   ```

4. **Push and create Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

   - Create PR targeting `dev` branch
   - Request code review from team members
   - Address feedback and update PR

5. **Merge to dev**
   - After approval, merge PR to `dev`
   - Delete feature branch
   - Test integration on `dev` branch

6. **Release to main**
   - When `dev` is stable, create PR from `dev` to `main`
   - This triggers production deployment

## 📱 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Testing
npm run test             # Run unit tests (when implemented)
npm run test:e2e         # Run end-to-end tests (when implemented)

# PWA
npm run build:pwa        # Build with PWA optimizations
```

## 🎨 UI/UX Guidelines

### Design System

- **Primary Color**: #4CAF50 (Material Green)
- **Secondary Color**: #8BC34A (Light Green)
- **Accent Color**: #CDDC39 (Lime)
- **Typography**: Roboto font family (Material Design default)

### Mobile-First Approach

- Design for mobile first, then scale up
- Minimum touch target size: 44x44px
- Use Vuetify's responsive grid system
- Test on actual mobile devices

### Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers

## 🗄️ Database Schema

### Firestore Collections

**users/{userId}**

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  numberOfPlants: number,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

**plants/{plantId}**

```javascript
{
  plantId: string,
  userId: string,
  plantType: string,
  nickname: string,
  photoURL: string,
  location: 'indoor' | 'outdoor',
  wateringFrequency: number, // days
  lightConditions: string,
  preferredTemp: number,
  currentLightConditions: string,
  lastWatered: timestamp,
  nextWateringDate: timestamp,
  geolocation: {
    latitude: number,
    longitude: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**reminders/{reminderId}**

```javascript
{
  reminderId: string,
  userId: string,
  plantId: string,
  date: timestamp,
  completed: boolean,
  skipped: boolean,
  createdAt: timestamp
}
```

**achievements/{achievementId}**

```javascript
{
  achievementId: string,
  userId: string,
  achievementType: string, // 'first_plant', 'streak_3', 'streak_10', '5_plants'
  title: string,
  description: string,
  unlockedAt: timestamp
}
```

## 🔧 Troubleshooting

### Common Issues

**Build fails with Firebase errors**

- Ensure all Firebase environment variables are set correctly
- Check that Firebase config object is valid

**Vuetify styles not loading**

- Verify Vuetify is properly imported in main.js
- Check that MDI font is included

**Camera not working on HTTPS**

- Camera API requires HTTPS in production
- Use ngrok or deploy to test camera features

**PWA not installing**

- Ensure manifest.json is correctly configured
- Check that service worker is registered
- Test on supported browsers (Chrome, Edge, Safari)

### Performance Optimization

- Use Vue's lazy loading for routes
- Optimize images before uploading to Firebase Storage
- Implement infinite scroll for large plant lists
- Cache weather data to reduce API calls

## 🧪 Testing Strategy

### Unit Tests

- Test utility functions
- Test component methods
- Test Firebase integration functions

### Integration Tests

- Test authentication flow
- Test CRUD operations with Firestore
- Test camera functionality

### E2E Tests

- Test complete user workflows
- Test PWA functionality
- Test responsive design on different devices

## 🚀 Deployment

### Firebase Hosting (Recommended)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`
