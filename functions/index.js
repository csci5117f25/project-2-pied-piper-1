/**
 * Cloud Functions for Plant Care Tracker
 * Securely handles API calls that require secret keys
 */

const functions = require('firebase-functions')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')

// Initialize admin once
admin.initializeApp()
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

    console.log(`Checking reminders at: ${currentTime} (${currentTime12})`)

    try {
      // Get all users with notifications enabled
      const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get()

      const sendPromises = []

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()
        const reminderTime = userData.reminderTime || '11:00 AM'

        // Normalize the reminder time for comparison
        let userReminderTime = reminderTime.trim()

        // Check if current time matches user's reminder time
        if (userReminderTime === currentTime12 || userReminderTime === currentTime) {
          console.log(`Sending reminder to user ${userDoc.id} at ${reminderTime}`)

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
                    console.log(`Successfully sent reminder to ${userDoc.id}:`, response)
                  })
                  .catch((error) => {
                    console.error(`Error sending to ${userDoc.id}:`, error)
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
            console.log(`User ${userDoc.id} has no FCM tokens`)
          }
        }
      })

      await Promise.all(sendPromises)
      console.log('Daily reminders check completed')
    } catch (error) {
      console.error('Error in sendDailyReminders:', error)
    }

    return null
  },
)
