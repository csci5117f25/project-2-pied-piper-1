# Plant Care Tracker - Development TODO

## Project Status Dashboard

### Current Phase: **Phase 1 - Core MVP (Weeks 1-2)**

### Target: **Progress Check-in Ready**

### 🎯 CURRENT FOCUS: **Authentication Flow** (Sprint 1)

**Branch:** `feature/authentication-flow`  
**Priority:** HIGH - Foundation for all other features

---

## ✅ IMMEDIATE SETUP (COMPLETED)

### ✅ Firebase Configuration (COMPLETED)

- [x] **Firebase Project Setup**
  - [x] Create Firebase project in console ✅
  - [x] Enable Authentication (Email/Password + Google OAuth) ✅
  - [x] Set up Firestore Database in production mode ✅
  - [x] Configure Firebase Storage for plant photos (ready)
  - [x] Generate Firebase config and update `src/firebase.js` ✅
  - [x] Set up Firestore security rules ✅
  - [x] Configure Firebase Storage rules ✅
  - [x] Firebase Hosting deployed: https://plant-care-tracker-cda44.web.app/ ✅

### 🔑 API Keys & Environment (NEXT SPRINT)

- [ ] **OpenWeatherMap API Setup**
  - [ ] Register for OpenWeatherMap API key
  - [ ] Add to `.env.local` file
  - [ ] Test API connection
- [ ] **GitHub Secrets Configuration**
  - [ ] Add Firebase credentials to GitHub Secrets
  - [ ] Add OpenWeatherMap API key to GitHub Secrets
  - [ ] Test CI/CD pipeline

---

## 📱 PHASE 1: CORE MVP (Weeks 1-2)

### 🔐 Sprint 1: Authentication Flow (Days 1-2) ✅ **MOSTLY COMPLETED**

**Assignee: Team Lead + Authentication Expert**  
**Status: ✅ COMPLETED**  
**Branch: feature/authentication-flow**

- [x] **Splash Screen Component** ✅
  - [x] Create landing page for non-authenticated users ✅
  - [x] Add "Login/Signup" and "Learn More" buttons ✅
  - [x] Implement app branding and plant-themed design ✅
- [x] **Login Component** ✅
  - [x] Email/password login form with validation ✅
  - [x] Google OAuth integration button ✅
  - [x] Error handling and loading states ✅
  - [x] "Forgot Password" functionality ✅
- [x] **Signup Component** ✅
  - [x] Registration form (name, email, password, confirm password) ✅
  - [ ] Email verification flow
  - [x] Terms of service acceptance ✅
  - [x] Auto-redirect to onboarding after signup ✅
- [x] **Route Guards** ✅
  - [x] Protect authenticated routes ✅
  - [x] Redirect logic (authenticated users skip splash) ✅
  - [x] Handle authentication state changes ✅
- [x] **User Profile Setup** ✅
  - [x] Create user document in Firestore on first login ✅
  - [x] Store basic profile information ✅
  - [x] User logout functionality ✅

**Deliverable:** Working login/signup flow with Firebase Auth

### 🌿 Sprint 2: Basic Plant CRUD (Days 3-5) ✅ **COMPLETED**

**Assignee: [Team Member Name]**

- [x] **Add Plant Form** ✅
  - [x] Basic plant information form (type, nickname) ✅
  - [x] Plant location selector (indoor/outdoor) ✅
  - [x] Watering frequency input ✅
  - [x] Light conditions selector ✅
  - [x] Temperature preferences ✅
  - [x] Form validation and error handling ✅
- [x] **Plant List View** ✅
  - [x] Display user's plants in card format ✅
  - [x] Plant thumbnail/placeholder images ✅
  - [x] Search/filter functionality ✅
  - [x] Edit and delete buttons ✅
- [x] **Plant Detail/Edit View** ✅
  - [x] Individual plant detail page ✅
  - [x] Edit plant information ✅
  - [x] Delete plant with confirmation ✅
  - [x] Plant care history placeholder ✅
- [x] **Firestore Integration** ✅
  - [x] Plants collection structure ✅
  - [x] VueFire reactive queries ✅
  - [x] User-scoped data access ✅
  - [x] CRUD operations with error handling ✅

**Deliverable:** Complete plant management system ✅

### 📅 Sprint 3: Calendar & Reminders (Days 6-8)

**Assignee: [Team Member Name]**

- [ ] **Home Dashboard**
  - [ ] Calendar widget showing current week
  - [x] "Plants to water today" section ✅ 
  - [x] Weather widget placeholder ✅ 
  - [x] User profile icon and navigation 
- [ ] **Calendar Component**
  - [ ] Weekly view with date navigation
  - [ ] Monthly view option
  - [ ] Display plants needing water each day
  - [ ] Visual indicators for care tasks
- [ ] **Watering Reminder System**
  - [ ] Calculate next watering dates
  - [ ] Daily task generation
  - [ ] Mark tasks complete/skip functionality
  - [ ] Manual reminder creation
- [ ] **Reminder Data Structure**
  - [ ] Reminders Firestore collection
  - [ ] Automatic reminder generation
  - [ ] Reminder status tracking

**Deliverable:** Functional calendar with watering reminders

### 🎨 Sprint 4: UI Polish & Mobile (Days 9-10)

**Assignee: [Team Member Name]**

- [ ] **Vuetify Theming**
  - [x] Custom plant-themed color palette ✅
  - [x] Material Design components integration ✅
  - [ ] Dark/light theme support
  - [ ] Custom plant icons and illustrations
- [ ] **Mobile Responsiveness**
  - [ ] Bottom navigation for mobile
  - [ ] Touch-friendly button sizes (44px minimum)
  - [ ] Swipe gestures for navigation
  - [ ] Mobile-optimized form layouts
- [ ] **Navigation & Layout**
  - [ ] Bottom navigation bar (Calendar, Plants, Rewards, Settings)
  - [ ] Responsive sidebar for desktop
  - [ ] Page transitions and loading states
  - [ ] Error pages (404, offline, etc.)

**Deliverable:** Polished, mobile-ready UI

---

## 🚀 PHASE 2: ENHANCED FEATURES (Weeks 3-4)

### 📸 Sprint 5: Camera Integration (Days 11-13)

**Assignee: [Team Member Name]**

- [ ] **Camera Functionality**
  - [ ] Device camera access via MediaDevices API
  - [ ] Full-screen camera interface with plant guide
  - [ ] Front/back camera switching
  - [ ] Photo capture and preview
  - [ ] Image compression and optimization
- [ ] **Photo Management**
  - [ ] Upload photos to Firebase Storage
  - [ ] Plant photo gallery
  - [ ] Before/after progress photos
  - [ ] Photo deletion and management
- [ ] **Photo Integration**
  - [ ] Add photos during plant creation
  - [ ] Edit plant photos
  - [ ] Photo tips and guidance overlay
  - [ ] Fallback to file upload if camera unavailable

**Deliverable:** Full camera integration for plant photos

### 🌤️ Sprint 6: Weather & Geolocation (Days 14-16)

**Assignee: [Team Member Name]**

- [ ] **Geolocation Integration**
  - [ ] Request location permissions
  - [ ] Get device GPS coordinates
  - [ ] Location-based plant grouping
  - [ ] Manual location entry fallback
- [ ] **Weather API Integration**
  - [ ] OpenWeatherMap API integration
  - [ ] Current weather data retrieval
  - [ ] 5-day weather forecast
  - [ ] Weather-based watering recommendations
- [ ] **Smart Recommendations**
  - [ ] Adjust watering based on rain forecast
  - [ ] Temperature-based care suggestions
  - [ ] Seasonal care adjustments
  - [ ] Indoor vs outdoor plant logic

**Deliverable:** Location-aware smart watering system

### 🔔 Sprint 7: PWA Features (Days 17-19)

**Assignee: [Team Member Name]**

- [ ] **Push Notifications**
  - [ ] Request notification permissions
  - [ ] Daily watering reminder notifications
  - [ ] Plant health alert notifications
  - [ ] Background notification scheduling
- [ ] **PWA Optimization**
  - [ ] Service worker optimization
  - [ ] Add to home screen functionality
  - [ ] Custom app icons and splash screens
  - [ ] Offline functionality for viewing plants
- [ ] **App Manifest**
  - [ ] PWA manifest configuration
  - [ ] App store optimization
  - [ ] Installation prompts
  - [ ] Standalone app experience

**Deliverable:** Native app-like PWA experience

### 🏆 Sprint 8: Rewards System (Days 20-21)

**Assignee: [Team Member Name]**

- [ ] **Achievement System**
  - [x] Static achievement badges
  - [x] Achievement unlock logic (first-plant and plant-collector implemented; other triggers pending)
  - [x] Achievement storage in Firestore (read + write helpers added)
  - [ ] Visual achievement notifications
- [ ] **Rewards Page**
  - [x] Achievement gallery display (dynamic, reads from user docs)
  - [x] Progress tracking for locked achievements (merged from Firestore docs)
  - [ ] Achievement sharing functionality
  - [x] Gamification elements (XP display + level system wired)

**Deliverable:** Engaging gamification system

---

## 🎖️ PHASE 3: AMBITION & POLISH (Week 5)

### ⭐ Sprint 9: Ambitious Features (Days 22-24)

**Choose ONE ambitious feature:**

#### Option A: AI Plant Identification

- [ ] Plant identification API integration
- [ ] Camera-based plant species detection
- [ ] Automatic care recommendation based on species
- [ ] Plant health assessment from photos

#### Option B: Advanced Analytics

- [ ] Plant growth tracking with photo timeline
- [ ] Care pattern analysis and insights
- [ ] Watering efficiency recommendations
- [ ] Plant health scoring system

#### Option C: Social Features

- [ ] Share plant progress photos
- [ ] Export care schedules to calendar
- [ ] Plant care tips sharing
- [ ] Community plant database

### 🎨 Sprint 10: Final Polish & Demo Prep (Days 25-26)

**Assignee: ALL TEAM MEMBERS**

- [ ] **Performance Optimization**
  - [ ] Image lazy loading
  - [ ] Code splitting and lazy routes
  - [ ] Firebase query optimization
  - [ ] Bundle size optimization
- [ ] **Accessibility**
  - [ ] Screen reader support
  - [ ] Keyboard navigation
  - [ ] Color contrast compliance
  - [ ] Alt text for images
- [ ] **Error Handling**
  - [ ] Comprehensive error boundaries
  - [ ] Offline error messages
  - [ ] Network failure handling
  - [ ] Form validation improvements
- [ ] **Demo Preparation**
  - [ ] Demo script and flow
  - [ ] Sample data creation
  - [ ] Demo plant setup
  - [ ] Presentation slides

---

## 🎯 GRADING ALIGNMENT CHECKLIST

### Functionality & Requirements (50-60 pts)

- [ ] Vue.js 3 with Composition API ✅
- [ ] Firebase Authentication ✅
- [ ] Firestore with VueFire ✅
- [ ] Vue Router with protected routes ✅
- [ ] Single-page application ✅
- [ ] Mobile-responsive design ✅
- [ ] User data isolation ✅
- [ ] CRUD operations working flawlessly ✅

### Device Integration/PWA (Required for full credit)

- [ ] Camera API integration ✅
- [ ] Geolocation API integration ✅
- [ ] Push notifications ✅
- [ ] Add to home screen ✅

### Polish & Presentation (10 pts)

- [ ] Vuetify Material Design ✅
- [ ] Custom theming ✅
- [ ] Smooth mobile experience ✅
- [ ] Professional visual design ✅
- [ ] 3-4 minute demo prepared ✅

### Ambition & Completeness (10-20 pts)

- [ ] Weather-based smart recommendations ✅
- [ ] Photo timeline/progress tracking ✅
- [ ] Achievement gamification system ✅
- [ ] One ambitious/creative feature ✅

---

## 📅 MILESTONE TIMELINE

### Week 1 (Nov 18-22): Core Foundation

- **Mon-Tue:** Firebase setup + Authentication
- **Wed-Thu:** Basic Plant CRUD
- **Fri:** UI Polish

### Week 2 (Nov 25-29): Calendar System

- **Mon-Tue:** Calendar + Reminders
- **Wed:** Mobile responsiveness
- **Thu-Fri:** Progress check-in prep

### Week 3 (Dec 2-6): Device Integration

- **Mon-Tue:** Camera integration
- **Wed-Thu:** Weather + Geolocation
- **Fri:** Testing & refinement

### Week 4 (Dec 9-13): PWA & Features

- **Mon-Tue:** Push notifications + PWA
- **Wed-Thu:** Rewards system
- **Fri:** Integration testing

### Week 5 (Dec 16-20): Final Sprint

- **Mon-Tue:** Ambitious feature
- **Wed-Thu:** Final polish
- **Fri:** Demo preparation

---

## 🚨 RISK MITIGATION

### High-Risk Items (Address First)

1. **Firebase Authentication** - Test early, have backups
2. **Camera API** - Browser compatibility varies
3. **Push Notifications** - Permission handling is tricky
4. **Mobile Testing** - Test on actual devices

### Backup Plans

- **Camera fails:** File upload fallback
- **Weather API fails:** Manual weather input
- **Push notifications fail:** In-app notifications only
- **Geolocation fails:** Manual location entry

---

## 🤝 TEAM ASSIGNMENTS

### Team Lead: Arunachalam Manikandan

- Firebase setup and configuration
- Project coordination and code reviews
- Final integration and demo preparation

### UI/UX: Aswatha Sadasivam

- Vuetify theming and components
- Mobile responsiveness
- Visual design and user experience

### Authentication: Erina Karati

- Firebase Auth implementation
- User management and profiles
- Route guards and security

### Backend: Poorna Bengaluru Shivaji Rao

- Plant CRUD operations
- Database design and optimization
- Firestore integration with VueFire

### Integrations: Prajwal Umesha

- Camera and geolocation APIs
- PWA features and service workers
- Device integration testing

---

## 📞 DAILY STANDUPS

**Format:** 15-minute daily check-ins

- What did you complete yesterday?
- What are you working on today?
- Any blockers or help needed?

**Schedule:** Every day at [TIME] via [PLATFORM]

---

## 🎉 SUCCESS METRICS

### Progress Check-in (Week 2)

- ✅ Demo: Login → Add Plant → Schedule → View Calendar
- ✅ Mobile responsiveness working
- ✅ Firebase integration solid

### Final Grade Target

- ✅ All core features flawless
- ✅ 2+ device/PWA features working
- ✅ 1 ambitious feature implemented
- ✅ Polished mobile experience
- ✅ Smooth demo execution

---

**Last Updated:** November 20, 2025  
**Next Update:** [Date when team updates this file]
