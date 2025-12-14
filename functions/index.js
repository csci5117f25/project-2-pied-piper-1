/**
 * Cloud Functions for Plant Care Tracker
 * Securely handles API calls that require secret keys
 */

const functions = require('firebase-functions')
const axios = require('axios')

// OpenWeatherMap API proxy
exports.getWeather = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { lat, lon, type } = data

  if (!lat || !lon) {
    throw new functions.https.HttpsError('invalid-argument', 'Latitude and longitude are required')
  }

  // Get API key from environment (supports both new and legacy config)
  const apiKey = process.env.OPENWEATHER_API_KEY || functions.config().openweather?.key
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'API key not configured')
  }

  const baseUrl = 'https://api.openweathermap.org/data/2.5'

  try {
    let url
    if (type === 'forecast') {
      url = `${baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    } else {
      url = `${baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    }

    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('Weather API error:', error)
    throw new functions.https.HttpsError('unavailable', 'Weather service temporarily unavailable')
  }
})

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})
