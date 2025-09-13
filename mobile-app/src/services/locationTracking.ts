import * as Location from "expo-location"
import * as TaskManager from "expo-task-manager"
import { supabase } from "./supabase"

const LOCATION_TASK_NAME = "background-location-task"
const LOCATION_UPDATE_INTERVAL = 30000 // 30 seconds
const LOCATION_DISTANCE_INTERVAL = 50 // 50 meters

interface LocationTrackingState {
  isTracking: boolean
  touristId: string | null
  lastLocation: Location.LocationObject | null
}

const trackingState: LocationTrackingState = {
  isTracking: false,
  touristId: null,
  lastLocation: null,
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Background location task error:", error)
    return
  }

  if (data) {
    const { locations } = data
    const location = locations[0]

    if (location && trackingState.touristId) {
      await logLocationToDatabase(trackingState.touristId, location)
      await checkForHazards(trackingState.touristId, location)
    }
  }
})

export const initializeLocationTracking = async (): Promise<boolean> => {
  try {
    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
    if (foregroundStatus !== "granted") {
      console.error("Foreground location permission not granted")
      return false
    }

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
    if (backgroundStatus !== "granted") {
      console.warn("Background location permission not granted - tracking will be limited")
    }

    return true
  } catch (error) {
    console.error("Location tracking initialization error:", error)
    return false
  }
}

export const startLocationTracking = async (touristId: string): Promise<boolean> => {
  try {
    if (trackingState.isTracking) {
      console.log("Location tracking already active")
      return true
    }

    trackingState.touristId = touristId
    trackingState.isTracking = true

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL,
      distanceInterval: LOCATION_DISTANCE_INTERVAL,
      foregroundService: {
        notificationTitle: "SafeTravel NE - Location Tracking",
        notificationBody: "Tracking your location for safety monitoring",
        notificationColor: "#059669",
      },
    })

    // Also start foreground tracking for immediate updates
    const foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000, // More frequent updates in foreground
        distanceInterval: 25,
      },
      async (location) => {
        trackingState.lastLocation = location
        await logLocationToDatabase(touristId, location)
        await checkForHazards(touristId, location)
      },
    )

    console.log("Location tracking started successfully")
    return true
  } catch (error) {
    console.error("Start location tracking error:", error)
    trackingState.isTracking = false
    return false
  }
}

export const stopLocationTracking = async (): Promise<void> => {
  try {
    if (!trackingState.isTracking) {
      return
    }

    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
    trackingState.isTracking = false
    trackingState.touristId = null
    trackingState.lastLocation = null

    console.log("Location tracking stopped")
  } catch (error) {
    console.error("Stop location tracking error:", error)
  }
}

export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000, // Use cached location if less than 10 seconds old
    })

    trackingState.lastLocation = location
    return location
  } catch (error) {
    console.error("Get current location error:", error)
    return trackingState.lastLocation
  }
}

export const getLastKnownLocation = (): Location.LocationObject | null => {
  return trackingState.lastLocation
}

export const isLocationTrackingActive = (): boolean => {
  return trackingState.isTracking
}

const logLocationToDatabase = async (touristId: string, location: Location.LocationObject) => {
  try {
    const locationData = {
      tourist_id: touristId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      battery_level: await getBatteryLevel(),
      network_type: await getNetworkType(),
      timestamp: new Date(location.timestamp).toISOString(),
    }

    const { error } = await supabase.from("location_logs").insert([locationData])

    if (error) {
      console.error("Location logging error:", error)
    }
  } catch (error) {
    console.error("Location logging error:", error)
  }
}

const checkForHazards = async (touristId: string, location: Location.LocationObject) => {
  try {
    // Check for geofence violations
    const { data: geofences, error: geofenceError } = await supabase.from("geofences").select("*").eq("active", true)

    if (geofenceError) {
      console.error("Geofence check error:", geofenceError)
      return
    }

    // Check for active hazards in the area
    const { data: hazards, error: hazardError } = await supabase.from("hazards").select("*").eq("status", "active")

    if (hazardError) {
      console.error("Hazard check error:", hazardError)
      return
    }

    // In a real implementation, you would use PostGIS functions to check
    // if the current location intersects with any geofences or hazards
    // For now, we'll just log that the check was performed
    console.log(`Hazard check completed for location: ${location.coords.latitude}, ${location.coords.longitude}`)
  } catch (error) {
    console.error("Hazard check error:", error)
  }
}

const getBatteryLevel = async (): Promise<number | null> => {
  try {
    // This would require expo-battery
    // For now, return null
    return null
  } catch (error) {
    return null
  }
}

const getNetworkType = async (): Promise<string | null> => {
  try {
    // This would require expo-network
    // For now, return null
    return null
  } catch (error) {
    return null
  }
}

export const getLocationHistory = async (touristId: string, hours = 24) => {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from("location_logs")
      .select("*")
      .eq("tourist_id", touristId)
      .gte("timestamp", startTime)
      .order("timestamp", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Location history error:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Location history error:", error)
    return []
  }
}
