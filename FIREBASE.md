# 🔥 Firebase Configuration - Plant Care Tracker

## ✅ Firebase Setup Status: **COMPLETED**

### 🎯 What We've Accomplished

**Project Details:**

- **Firebase Project ID:** `plant-care-tracker-cda44`
- **Project URL:** `https://plant-care-tracker-cda44.web.app/` (Live and deployed!)
- **Firebase Console:** [https://console.firebase.google.com/project/plant-care-tracker-cda44](https://console.firebase.google.com/project/plant-care-tracker-cda44)

### ✅ Completed Setup Checklist

**✅ Step 1: Firebase Project Created**

- Project name: `plant-care-tracker-cda44`
- Google Analytics enabled
- Firebase Hosting enabled

**✅ Step 2: Authentication Enabled**

- Email/Password authentication ✅
- Google OAuth authentication ✅
- Test user functionality working ✅

**✅ Step 3: Firestore Database Configured**

- Production mode database created ✅
- Security rules implemented ✅
- User data isolation enforced ✅

**✅ Step 4: Firebase Hosting Deployed**

- Custom domain: `plant-care-tracker-cda44.web.app`
- SSL certificate active ✅
- Global CDN enabled ✅
- Single-page app routing configured ✅

**✅ Step 5: Configuration Integrated**

- Firebase config directly integrated in `src/firebase.js`
- Authentication, Firestore, Storage, and Analytics initialized
- Test component created and working ✅

**✅ Step 6: Security Rules Deployed**

- Firestore security rules active
- User-scoped data access enforced
- Ready for production use ✅

---

# 🔥 Firebase Setup Guide - Plant Care Tracker (REFERENCE)

## 🎯 Quick Setup Checklist

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Project name: `plant-care-tracker` (or your choice)
4. Enable Google Analytics: **Yes** (recommended)
5. Complete project creation

### Step 2: Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** provider
4. Enable **Google** provider
   - Add your Gmail as authorized domain
   - Download OAuth configuration if needed

### Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. **Start in production mode** (we'll configure rules)
3. Choose location closest to your users (e.g., `us-central1`)

### Step 4: Set Up Storage

1. Go to **Storage** → **Get started**
2. **Start in production mode**
3. Use same location as Firestore

### Step 5: Get Configuration

1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll to **Your apps** section
3. Click **Add app** → **Web app** (</> icon)
4. App name: `Plant Care Tracker`
5. **Check** "Also set up Firebase Hosting"
6. **Copy the firebaseConfig object**

### Step 6: Set Up Environment Variables

1. Copy `.env.example` to `.env.local` in project root
2. Fill in the values from your Firebase config:

```env
# Firebase Configuration (from your config object)
VITE_FIREBASE_API_KEY=AIzaSyB...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=plant-care-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=plant-care-tracker
VITE_FIREBASE_STORAGE_BUCKET=plant-care-tracker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF4

# OpenWeatherMap API (get from openweathermap.org)
VITE_OPENWEATHER_API_KEY=your-openweather-api-key
```

## 🛡️ Security Rules Setup

### Firestore Rules

Go to **Firestore Database** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Plants belong to users - users can only access their own plants
    match /plants/{plantId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Reminders belong to users
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Achievements belong to users
    match /achievements/{achievementId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Storage Rules

Go to **Storage** → **Rules** and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own photos
    match /users/{userId}/plants/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Profile photos
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔑 OpenWeatherMap API Setup

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free account
3. Go to **API Keys** section
4. Copy your API key
5. Add to `.env.local` as `VITE_OPENWEATHER_API_KEY`

## ✅ Test Your Setup

Run this test to verify everything works:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
# Check browser console for any Firebase errors
```

## 🚀 Deploy Setup (For Later)

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting in your project
firebase init hosting

# When prompted:
# - Select your Firebase project
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
```

### GitHub Secrets (For CI/CD)

Add these secrets in GitHub repository settings:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_OPENWEATHER_API_KEY
FIREBASE_SERVICE_ACCOUNT_KEY
```

## 📱 Test Data Structure

Once setup is complete, you can test with this sample data:

### Sample User (Auto-created on signup)

```javascript
// users/{userId}
{
  uid: "user123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  numberOfPlants: 2,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Sample Plant

```javascript
// plants/{plantId}
{
  plantId: "plant123",
  userId: "user123",
  plantType: "Snake Plant",
  nickname: "Sammy",
  photoURL: "gs://bucket/users/user123/plants/plant123.jpg",
  location: "indoor",
  wateringFrequency: 7, // days
  lightConditions: "indirect",
  preferredTemp: 72,
  lastWatered: timestamp,
  nextWateringDate: timestamp,
  createdAt: timestamp
}
```

## 🆘 Troubleshooting

### Common Issues:

**"Firebase config not found"**

- Check `.env.local` file exists and has correct variable names
- Restart development server after adding env vars

**"Permission denied" errors**

- Verify Firestore rules are set correctly
- Check user is authenticated before making requests

**"Storage upload fails"**

- Verify Storage rules are configured
- Check file size limits (default: 10MB max)

**Build fails with Firebase errors**

- Ensure all env variables are set in production
- Check that Firebase project is active and billing enabled

### Getting Help:

1. Check browser console for specific error messages
2. Verify Firebase project settings match your config
3. Test authentication first before other features
4. Use Firebase Console to monitor database activity

---

**✨ Once setup is complete, all team members can work with the same Firebase project!**
