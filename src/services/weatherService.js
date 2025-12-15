/**
 * Weather Service - OpenWeatherMap API Integration
 * Provides weather data and smart watering recommendations
 * Uses Cloud Functions to protect API keys
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from '@/firebase'

// Initialize Cloud Functions
const functions = getFunctions(firebaseApp)
const getWeatherFunction = httpsCallable(functions, 'getWeather')

// Fallback to direct API for development (if .env.local exists)
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const USE_CLOUD_FUNCTIONS = import.meta.env.VITE_USE_CLOUD_FUNCTIONS === 'true'

// Cache weather data to reduce API calls
const weatherCache = new Map()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

/**
 * Get current weather by coordinates
 */
export async function getCurrentWeather(lat, lon) {
  const cacheKey = `current_${lat}_${lon}`
  const cached = weatherCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    let data

    // Use Cloud Function in production, direct API in development
    if (USE_CLOUD_FUNCTIONS || !API_KEY) {
      const result = await getWeatherFunction({ lat, lon, type: 'current' })
      data = result.data
    } else {
      // Fallback for local development
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
      )
      if (!response.ok) {
        throw new Error('Weather data unavailable')
      }
      data = await response.json()
    }

    const weatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      pressure: data.main.pressure,
      cloudiness: data.clouds.all,
      icon: data.weather[0].icon,
      location: data.name,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timestamp: Date.now(),
    }

    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() })
    return weatherData
  } catch (error) {
    console.error('Error fetching current weather:', error)
    throw error
  }
}

/**
 * Get 5-day weather forecast
 */
export async function getWeatherForecast(lat, lon) {
  const cacheKey = `forecast_${lat}_${lon}`
  const cached = weatherCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    let data

    // Use Cloud Function in production, direct API in development
    if (USE_CLOUD_FUNCTIONS || !API_KEY) {
      const result = await getWeatherFunction({ lat, lon, type: 'forecast' })
      data = result.data
    } else {
      // Fallback for local development
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
      )
      if (!response.ok) {
        throw new Error('Weather forecast unavailable')
      }
      data = await response.json()
    }

    // Group by day and get daily summaries
    const dailyForecasts = []
    const processedDays = new Set()

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toISOString().split('T')[0]

      if (!processedDays.has(dateKey)) {
        processedDays.add(dateKey)
        dailyForecasts.push({
          date: dateKey,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          condition: item.weather[0].main,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6),
          rain: item.rain?.['3h'] || 0,
          icon: item.weather[0].icon,
        })
      }
    })

    const forecastData = {
      forecasts: dailyForecasts.slice(0, 5), // Next 5 days
      timestamp: Date.now(),
    }

    weatherCache.set(cacheKey, { data: forecastData, timestamp: Date.now() })
    return forecastData
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    throw error
  }
}

/**
 * Get smart watering recommendation based on weather
 */
export function getWateringRecommendation(weatherData, forecast = null) {
  const { temperature, humidity, condition } = weatherData

  // Check for rain in forecast
  const willRainSoon =
    forecast?.forecasts?.some(
      (day) => day.condition.toLowerCase().includes('rain') && day.rain > 2,
    ) || false

  // High temperature recommendation
  if (temperature > 30) {
    return {
      level: 'high',
      message: 'Water more frequently',
      reason: 'Very hot weather increases evaporation',
      color: 'error',
      icon: 'mdi-water-alert',
    }
  }

  // Hot weather
  if (temperature > 25) {
    if (humidity < 40) {
      return {
        level: 'high',
        message: 'Water more often',
        reason: 'Hot and dry conditions',
        color: 'warning',
        icon: 'mdi-water-plus',
      }
    }
    return {
      level: 'medium-high',
      message: 'Monitor closely',
      reason: 'Warm weather',
      color: 'warning',
      icon: 'mdi-water',
    }
  }

  // Rain forecast - reduce watering
  if (willRainSoon) {
    return {
      level: 'low',
      message: 'Reduce watering',
      reason: 'Rain expected soon',
      color: 'info',
      icon: 'mdi-weather-rainy',
    }
  }

  // Currently raining
  if (condition.toLowerCase().includes('rain')) {
    return {
      level: 'low',
      message: 'Skip outdoor watering',
      reason: 'Currently raining',
      color: 'info',
      icon: 'mdi-weather-pouring',
    }
  }

  // Cold weather
  if (temperature < 15) {
    return {
      level: 'low',
      message: 'Water less frequently',
      reason: 'Cool weather slows evaporation',
      color: 'info',
      icon: 'mdi-water-minus',
    }
  }

  // Very cold
  if (temperature < 10) {
    return {
      level: 'very-low',
      message: 'Minimal watering',
      reason: 'Cold weather - plants need less water',
      color: 'primary',
      icon: 'mdi-snowflake',
    }
  }

  // High humidity
  if (humidity > 80) {
    return {
      level: 'low',
      message: 'Water moderately',
      reason: 'High humidity reduces water loss',
      color: 'success',
      icon: 'mdi-water-check',
    }
  }

  // Normal conditions
  return {
    level: 'normal',
    message: 'Normal watering',
    reason: 'Weather conditions are ideal',
    color: 'success',
    icon: 'mdi-water-check',
  }
}

/**
 * Get weather icon name for display
 */
export function getWeatherIcon(condition) {
  const conditionLower = condition.toLowerCase()

  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return 'mdi-weather-sunny'
  }
  if (conditionLower.includes('cloud')) {
    return 'mdi-weather-cloudy'
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'mdi-weather-rainy'
  }
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return 'mdi-weather-lightning'
  }
  if (conditionLower.includes('snow')) {
    return 'mdi-weather-snowy'
  }
  if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
    return 'mdi-weather-fog'
  }

  return 'mdi-weather-partly-cloudy'
}

/**
 * Get user's location using browser geolocation
 */
export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`))
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      },
    )
  })
}

/**
 * Get weather for user's current location
 */
export async function getWeatherForCurrentLocation() {
  try {
    const location = await getUserLocation()
    const weather = await getCurrentWeather(location.lat, location.lon)
    const forecast = await getWeatherForecast(location.lat, location.lon)

    return {
      weather,
      forecast,
      location,
      recommendation: getWateringRecommendation(weather, forecast),
    }
  } catch (error) {
    console.error('Error getting weather for current location:', error)
    throw error
  }
}

/**
 * Clear weather cache (useful for testing or manual refresh)
 */
export function clearWeatherCache() {
  weatherCache.clear()
}
