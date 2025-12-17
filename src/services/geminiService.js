/**
 * Gemini AI Service - Plant Identification and Care Recommendations
 * Uses Firebase Cloud Functions to securely call Gemini API
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

/**
 * Convert a File/Blob to base64 string
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze a plant image using Gemini AI via Cloud Functions
 * Returns structured plant information for form auto-fill
 */
export async function analyzePlantImage(imageFile) {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile)

  // Determine MIME type
  const mimeType = imageFile.type || 'image/jpeg'

  try {
    // Call the cloud function
    const analyzePlant = httpsCallable(functions, 'analyzePlant')
    const result = await analyzePlant({
      imageBase64: base64Image,
      mimeType: mimeType,
    })

    const plantInfo = result.data

    // Validate and normalize the response
    return {
      plantType: plantInfo.name || 'Unknown Plant',
      suggestedNickname: plantInfo.scientificName || '',
      careNotes: plantInfo.specialCare || '',
      wateringFrequency: mapWaterFrequencyToDays(plantInfo.waterFrequency),
      lightRequirement: normalizeLightRequirement(plantInfo.sunlight),
      needsFertilizer: plantInfo.fertilizerFrequency !== 'never',
      needsPruning: plantInfo.maintenanceFrequency !== 'never',
      fertilizerFrequency: plantInfo.fertilizerFrequency || 'quarterly',
      maintenanceFrequency: plantInfo.maintenanceFrequency || 'quarterly',
      confidence: 'high',
      success: true,
    }
  } catch (error) {
    console.error('Error analyzing plant image:', error)
    return {
      success: false,
      error: error.message || 'Failed to analyze plant image',
    }
  }
}

/**
 * Map water frequency days to form options
 */
function mapWaterFrequencyToDays(days) {
  if (!days) return 'weekly'
  if (days <= 1) return 'daily'
  if (days <= 3) return 'alternate-days'
  if (days <= 9) return 'weekly'
  if (days <= 18) return 'biweekly'
  return 'monthly'
}

/**
 * Normalize watering frequency to match form options
 */
function normalizeWateringFrequency(value) {
  const normalized = (value || '').toLowerCase().replace(/\s+/g, '-')
  const validOptions = ['daily', 'alternate-days', 'weekly', 'biweekly', 'monthly']

  if (validOptions.includes(normalized)) {
    return normalized
  }

  // Try to match partial values
  if (normalized.includes('daily') || normalized.includes('day')) {
    return 'daily'
  }
  if (normalized.includes('alternate') || normalized.includes('other')) {
    return 'alternate-days'
  }
  if (normalized.includes('bi') || normalized.includes('two') || normalized.includes('2')) {
    return 'biweekly'
  }
  if (normalized.includes('week')) {
    return 'weekly'
  }
  if (normalized.includes('month')) {
    return 'monthly'
  }

  return 'weekly' // Default
}

/**
 * Normalize light requirement to match form options
 */
function normalizeLightRequirement(value) {
  const normalized = (value || '').toLowerCase().replace(/\s+/g, '-')
  const validOptions = ['low', 'bright-indirect', 'bright-direct', 'full-sun']

  if (validOptions.includes(normalized)) {
    return normalized
  }

  // Try to match partial values
  if (normalized.includes('low') || normalized.includes('shade')) {
    return 'low'
  }
  if (normalized.includes('indirect')) {
    return 'bright-indirect'
  }
  if (normalized.includes('direct') && !normalized.includes('indirect')) {
    return 'bright-direct'
  }
  if (normalized.includes('full') || normalized.includes('sun')) {
    return 'full-sun'
  }

  return 'bright-indirect' // Default
}

/**
 * Test the Gemini API connection
 */
export async function testGeminiConnection() {
  try {
    const ai = getAIClient()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "Gemini is connected!" in exactly those words.',
    })
    return {
      success: true,
      message: response.text,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
