/**
 * Cloud Functions for Plant Care Tracker
 * Securely handles API calls that require secret keys
 */

const functions = require('firebase-functions')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// Initialize admin once
initializeApp()
const db = getFirestore();
const messaging = getMessaging();

const axios = require('axios')

// Gemini AI proxy for plant identification
exports.analyzePlant = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { imageBase64, mimeType } = request.data

  if (!imageBase64) {
    throw new HttpsError('invalid-argument', 'Image data is required')
  }

  const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Gemini API key not configured')
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are an expert botanist and plant care specialist. Analyze this plant image and provide detailed information.

IMPORTANT: Respond ONLY with valid JSON in exactly this format, no other text:
{
  "name": "Common name of the plant",
  "scientificName": "Scientific/botanical name",
  "type": "Type of plant (e.g., Succulent, Tropical, Flowering, etc.)",
  "waterFrequency": number (days between watering, e.g., 7),
  "sunlight": "Light requirement (Low, Medium, High, or Direct)",
  "temperature": "Ideal temperature range",
  "humidity": "Humidity preference (Low, Medium, High)",
  "soilType": "Recommended soil type",
  "fertilizerFrequency": "never, monthly, bimonthly, quarterly, seasonal, biannually, annually",
  "maintenanceFrequency": "never, monthly, bimonthly, quarterly, seasonal, biannually, annually",
  "toxicity": "Pet safety information",
  "growthRate": "Growth rate (Slow, Medium, Fast)",
  "matureSize": "Expected mature size",
  "specialCare": "Any special care instructions or tips",
  "commonIssues": "Common problems and solutions"
}

Be precise with the waterFrequency (number of days). Choose appropriate frequencies for fertilizer and maintenance from the exact options listed.`,
              },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      },
    )

    const text = response.data.candidates[0].content.parts[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const plantData = JSON.parse(jsonMatch[0])
      return plantData
    } else {
      throw new Error('Invalid response format from Gemini')
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new functions.https.HttpsError(
      'unavailable',
      'Plant identification service temporarily unavailable',
    )
  }
})

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

// Scheduled function for daily plant care reminders
// Runs every minute to check if users need their daily reminder
exports.sendDailyReminders = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'America/Chicago',
  },
  async (event) => {
    logger.info(`Checking reminders...`)

    try {
      // Get all users (we'll filter by notification settings in the loop)
      const usersSnapshot = await db.collection('users').get()

      logger.info(`Found ${usersSnapshot.size} total users, checking for enabled notifications`)

      const sendPromises = []

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()

        // Skip if notifications are not enabled
        if (!userData.notificationsEnabled) {
          return
        }

        const userTimeZone = userData.timeZone || 'America/Chicago'
        const now = new Date()
        
        // Get user's current time parts
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimeZone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        })
        
        const parts = formatter.formatToParts(now)
        const hourPart = parts.find(p => p.type === 'hour').value
        const minutePart = parts.find(p => p.type === 'minute').value
        
        let currentHour = parseInt(hourPart)
        const currentMinute = parseInt(minutePart)
        
        if (currentHour === 24) currentHour = 0
        
        // Parse reminder time
        let reminderHour = 9
        let reminderMinute = 0
        const rTime = userData.reminderTime || '09:00'
        
        try {
            if (rTime.includes('AM') || rTime.includes('PM')) {
                const [t, period] = rTime.split(' ')
                let [h, m] = t.split(':').map(Number)
                if (period === 'PM' && h !== 12) h += 12
                if (period === 'AM' && h === 12) h = 0
                reminderHour = h
                reminderMinute = m
            } else {
                const [h, m] = rTime.split(':').map(Number)
                reminderHour = h
                reminderMinute = m
            }
        } catch (e) {
            logger.error(`Error parsing time for user ${userDoc.id}: ${rTime}`, e)
            return
        }

        logger.info(
          `User ${userDoc.id}: Timezone=${userTimeZone}, Current=${currentHour}:${currentMinute}, Reminder=${reminderHour}:${reminderMinute}`,
        )

        // Check if current time matches user's reminder time
        if (currentHour === reminderHour && currentMinute === reminderMinute) {
          logger.info(`Sending reminder to user ${userDoc.id} at ${rTime}`)

          // Get user's FCM tokens
          const fcmTokens = userData.fcmTokens || []

          if (fcmTokens.length > 0) {
            const messages = fcmTokens.map((token) => ({
              notification: {
                title: "🌱 Hey, don't forget your plants!",
                body: '💚 Time to check on your green friends today! 🪴',
              },
              token: token,
            }))

            // Send to all tokens
            messages.forEach((message) => {
              sendPromises.push(
                messaging
                  .send(message)
                  .then((response) => {
                    logger.info(`Successfully sent reminder to ${userDoc.id}:`, response)
                  })
                  .catch((error) => {
                    // Check for invalid token errors first
                    if (
                      error.code === 'messaging/invalid-registration-token' ||
                      error.code === 'messaging/registration-token-not-registered'
                    ) {
                      logger.info(`Removing invalid token for user ${userDoc.id}`)
                      return db
                        .collection('users')
                        .doc(userDoc.id)
                        .update({
                          fcmTokens: FieldValue.arrayRemove(message.token),
                        })
                    }

                    // Log actual unexpected errors
                    logger.error(`Error sending to ${userDoc.id}:`, error)
                  }),
              )
            })
          } else {
            logger.warn(`User ${userDoc.id} has no FCM tokens`)
          }
        }
      })

      await Promise.all(sendPromises)
      logger.info('Daily reminders check completed')
    } catch (error) {
      logger.error('Error in sendDailyReminders:', error)
    }

    return null
  },
)

// Manual test function (callable from frontend)
exports.sendTestNotification = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }

  const uid = request.auth.uid
  
  try {
    const userDoc = await db.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found')
    }

    const userData = userDoc.data()
    const tokens = userData.fcmTokens || []

    if (tokens.length === 0) {
      return { success: false, message: 'No FCM tokens found. Please enable notifications first.' }
    }

    const results = { success: 0, failure: 0 }
    const promises = tokens.map(async (token) => {
      const message = {
        notification: {
          title: '🔔 Test Notification',
          body: 'This is a test from the server! If you see this, notifications are working.',
        },
        token: token,
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      }

      try {
        await messaging.send(message)
        results.success++
        return { success: true }
      } catch (error) {
        console.error('Error sending test message:', error)
        results.failure++
        
        // Cleanup invalid tokens
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          await db.collection('users').doc(uid).update({
            fcmTokens: FieldValue.arrayRemove(token)
          })
        }
        return { success: false, error }
      }
    })

    await Promise.all(promises)
    return results

  } catch (error) {
    console.error('Error in sendTestNotification:', error)
    throw new HttpsError('internal', 'Failed to send notification')
  }
})

