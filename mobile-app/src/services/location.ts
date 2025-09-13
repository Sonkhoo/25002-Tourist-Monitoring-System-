import * as Location from "expo-location"
import { supabase } from "./supabase"

export interface LocationData {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  speed?: number
}

let locationSubscription: Location.LocationSubscription | null = null

export const initializeLocation = async (): Promise<boolean> => {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      console.error("Location permission not granted")
      return false
    }

    // Request background permissions for continuous tracking
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync()
    if (backgroundStatus.status !== "granted") {
      console.warn("Background location permission not granted")
    }

    return true
  } catch (error) {
    console.error("Location initialization error:", error)
    return false
  }
}

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
    }
  } catch (error) {
    console.error("Get current location error:", error)
    return null
  }
}

export const startLocationTracking = async (touristId: string) => {
  try {
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
      },
      async (location) => {
        await logLocation(touristId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
          accuracy: location.coords.accuracy || undefined,
          speed: location.coords.speed || undefined,
        })
      },
    )
  } catch (error) {
    console.error("Start location tracking error:", error)
  }
}

export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove()
    locationSubscription = null
  }
}

export const logLocation = async (touristId: string, locationData: LocationData) => {
  try {
    const { error } = await supabase.from("location_logs").insert({
      tourist_id: touristId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      altitude: locationData.altitude,
      accuracy: locationData.accuracy,
      speed: locationData.speed,
      timestamp: new Date().toISOString(),
    })

    if (error) {
      console.error("Location logging error:", error)
    }
  } catch (error) {
    console.error("Location logging error:", error)
  }
}
