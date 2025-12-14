# Security Best Practices - Quick Reference

## ✅ What We Fixed

### Before (Insecure)

- OpenWeatherMap API key exposed in client code
- Direct API calls from browser
- Anyone could steal and use your API key

### After (Secure)

- API key stored securely in Firebase Functions config
- Client calls Cloud Function (authenticated)
- Cloud Function makes API request with secret key
- No API keys in client bundle

## 📁 File Changes

### New Files

- `functions/index.js` - Cloud Functions for secure API calls
- `functions/package.json` - Functions dependencies
- `functions/.gitignore` - Ignore functions node_modules
- `DEPLOYMENT.md` - Complete deployment guide

### Modified Files

- `src/services/weatherService.js` - Now uses Cloud Functions
- `.gitignore` - Added functions/ to ignore list

## 🚀 Quick Start

### Local Development (Uses Direct API)

```bash
# Keep your .env.local with the API key
VITE_USE_CLOUD_FUNCTIONS=false
VITE_OPENWEATHER_API_KEY=your_key

npm run dev
```

### Production Deployment

```bash
# 1. Set function config (one time)
firebase functions:config:set openweather.key="YOUR_KEY"

# 2. Update .env.local for build
VITE_USE_CLOUD_FUNCTIONS=true

# 3. Build and deploy
npm run build
firebase deploy
```

## 🔒 Important Notes

1. **Firebase Config is Safe to Expose**
   - The config in `firebase.js` and `firebase-messaging-sw.js` is PUBLIC
   - Firebase uses Security Rules for protection, not secret keys
   - Don't worry about these being in your code

2. **API Keys Need Protection**
   - Third-party API keys (OpenWeather, etc.) should use Cloud Functions
   - Never commit API keys to git
   - Use `.env.local` for development only

3. **Environment Variables**
   - `.env.local` is gitignored (safe)
   - Use `VITE_` prefix for Vite to expose them
   - Production uses Firebase Functions config instead

## 💰 Cost Considerations

- Firebase Functions free tier: 2M invocations/month
- Weather caching reduces API calls (30 min cache)
- Upgrade to Blaze plan needed for Functions (pay-as-you-go)

## 📊 How It Works

```
User Browser                Cloud Function              OpenWeather API
    |                            |                            |
    |-- Request Weather -------->|                            |
    |   (authenticated)          |                            |
    |                            |-- API Call --------------->|
    |                            |   (with secret key)        |
    |                            |<-- Weather Data -----------|
    |<-- Weather Data -----------|                            |
    |   (cached 30min)           |                            |
```

## 🔍 Verification

Check your production build doesn't expose keys:

```bash
npm run build
grep -r "YOUR_ACTUAL_API_KEY" dist/
# Should return nothing
```

## 📝 Quick Commands

```bash
# View function config
firebase functions:config:get

# Deploy only functions
firebase deploy --only functions

# View function logs
firebase functions:log

# Test locally with emulator
firebase emulators:start --only functions
```

See `DEPLOYMENT.md` for complete guide!
