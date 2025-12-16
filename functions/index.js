/**
 * Cloud Functions for Plant Care Tracker
 * Securely handles API calls that require secret keys
 */

const functions = require('firebase-functions')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions/v2')
const admin = require('firebase-admin')

// Initialize admin once
admin.initializeApp()
const axios = require('axios')

// Gemini AI proxy for plant identification
exports.analyzePlant = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { imageBase64, mimeType } = request.data

  if (!imageBase64) {
    throw new functions.https.HttpsError('invalid-argument', 'Image data is required')
  }

  const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured')
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
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${currentHour}:${String(currentMinute).padStart(2, '0')}`

    // Also check 12-hour format
    const hour12 = currentHour % 12 || 12
    const ampm = currentHour >= 12 ? 'PM' : 'AM'
    const currentTime12 = `${hour12}:${String(currentMinute).padStart(2, '0')} ${ampm}`

    logger.info(`Checking reminders at: ${currentTime} (${currentTime12})`)

    try {
      // Get all users (we'll filter by notification settings in the loop)
      const usersSnapshot = await admin.firestore().collection('users').get()

      logger.info(`Found ${usersSnapshot.size} total users, checking for enabled notifications`)

      const sendPromises = []

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()

        // Skip if notifications are not enabled
        if (!userData.notificationsEnabled) {
          return
        }

        const reminderTime = userData.reminderTime || '11:00 AM'

        // Normalize the reminder time for comparison
        let userReminderTime = reminderTime.trim()

        logger.info(
          `User ${userDoc.id}: reminderTime="${userReminderTime}", current="${currentTime12}"`,
        )

        // Check if current time matches user's reminder time
        if (userReminderTime === currentTime12 || userReminderTime === currentTime) {
          logger.info(`Sending reminder to user ${userDoc.id} at ${reminderTime}`)

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
                admin
                  .messaging()
                  .send(message)
                  .then((response) => {
                    logger.info(`Successfully sent reminder to ${userDoc.id}:`, response)
                  })
                  .catch((error) => {
                    logger.error(`Error sending to ${userDoc.id}:`, error)
                    // If token is invalid, remove it
                    if (
                      error.code === 'messaging/invalid-registration-token' ||
                      error.code === 'messaging/registration-token-not-registered'
                    ) {
                      return admin
                        .firestore()
                        .collection('users')
                        .doc(userDoc.id)
                        .update({
                          fcmTokens: admin.firestore.FieldValue.arrayRemove(message.token),
                        })
                    }
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
