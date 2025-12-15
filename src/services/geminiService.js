/**
 * Gemini AI Service - Plant Identification and Care Recommendations
 * Uses Google Gemini 2.5 Flash for image-based plant analysis
 */

import { GoogleGenAI } from '@google/genai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Initialize Gemini AI client
const getAIClient = () => {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured')
  }
  return new GoogleGenAI({ apiKey: API_KEY })
}

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
 * Analyze a plant image using Gemini AI
 * Returns structured plant information for form auto-fill
 */
export async function analyzePlantImage(imageFile) {
  const ai = getAIClient()

  // Convert image to base64
  const base64Image = await fileToBase64(imageFile)

  // Determine MIME type
  const mimeType = imageFile.type || 'image/jpeg'

  // Create the prompt for structured plant analysis
  const prompt = `You are an expert botanist and plant care specialist. Analyze this plant image and provide detailed information.

IMPORTANT: Respond ONLY with valid JSON in exactly this format, no other text:

{
  "plantType": "Common name of the plant species (e.g., 'Monstera Deliciosa', 'Snake Plant')",
  "suggestedNickname": "A creative, friendly nickname for this plant (e.g., 'Sunny', 'Monty', 'Spike')",
  "careNotes": "2-3 sentences of helpful care tips specific to this plant type. Include any special needs or common issues to watch for.",
  "wateringFrequency": "One of: 'daily', 'alternate-days', 'weekly', 'biweekly', 'monthly'",
  "lightRequirement": "One of: 'low', 'bright-indirect', 'bright-direct', 'full-sun'",
  "needsFertilizer": true or false,
  "needsPruning": true or false,
  "confidence": "high", "medium", or "low" - how confident you are in the plant identification
}

If you cannot identify the plant clearly, still provide your best guess with "confidence": "low" and mention the uncertainty in careNotes.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    })

    // Extract the text response
    const responseText = response.text

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = responseText

    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '')
    }

    // Trim whitespace
    jsonStr = jsonStr.trim()

    // Parse the JSON
    const plantInfo = JSON.parse(jsonStr)

    // Validate and normalize the response
    return {
      plantType: plantInfo.plantType || 'Unknown Plant',
      suggestedNickname: plantInfo.suggestedNickname || '',
      careNotes: plantInfo.careNotes || '',
      wateringFrequency: normalizeWateringFrequency(plantInfo.wateringFrequency),
      lightRequirement: normalizeLightRequirement(plantInfo.lightRequirement),
      needsFertilizer: Boolean(plantInfo.needsFertilizer),
      needsPruning: Boolean(plantInfo.needsPruning),
      confidence: plantInfo.confidence || 'medium',
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
