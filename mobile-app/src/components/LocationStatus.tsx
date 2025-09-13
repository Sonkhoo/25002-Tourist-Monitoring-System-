"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import {
  isLocationTrackingActive,
  getLastKnownLocation,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
} from "../services/locationTracking"
import type * as Location from "expo-location"

interface LocationStatusProps {
  touristId: string
}

export const LocationStatus: React.FC<LocationStatusProps> = ({ touristId }) => {
  const [isTracking, setIsTracking] = useState(false)
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkTrackingStatus()
    const interval = setInterval(checkTrackingStatus, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const checkTrackingStatus = () => {
    setIsTracking(isLocationTrackingActive())
    setLastLocation(getLastKnownLocation())
  }

  const handleToggleTracking = async () => {
    setIsLoading(true)
    try {
      if (isTracking) {
        await stopLocationTracking()
      } else {
        await startLocationTracking(touristId)
      }
      checkTrackingStatus()
    } catch (error) {
      console.error("Toggle tracking error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshLocation = async () => {
    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      setLastLocation(location)
    } catch (error) {
      console.error("Refresh location error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isTracking ? "#059669" : "#dc2626" }]} />
          <Text style={styles.statusText}>{isTracking ? "Tracking Active" : "Tracking Inactive"}</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, isTracking ? styles.stopButton : styles.startButton]}
          onPress={handleToggleTracking}
          disabled={isLoading}
        >
          <Ionicons name={isTracking ? "stop" : "play"} size={16} color={isTracking ? "#dc2626" : "#059669"} />
          <Text style={[styles.toggleButtonText, isTracking ? styles.stopButtonText : styles.startButtonText]}>
            {isLoading ? "..." : isTracking ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>

      {lastLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#059669" />
            <Text style={styles.locationText}>
              {lastLocation.coords.latitude.toFixed(6)}, {lastLocation.coords.longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.locationDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Accuracy</Text>
              <Text style={styles.detailValue}>
                {lastLocation.coords.accuracy ? `±${Math.round(lastLocation.coords.accuracy)}m` : "Unknown"}
              </Text>
            </View>

            {lastLocation.coords.speed && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Speed</Text>
                <Text style={styles.detailValue}>{Math.round(lastLocation.coords.speed * 3.6)} km/h</Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Update</Text>
              <Text style={styles.detailValue}>{formatLastUpdate(lastLocation.timestamp)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation} disabled={isLoading}>
            <Ionicons name="refresh" size={16} color="#059669" />
            <Text style={styles.refreshButtonText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {!lastLocation && (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={32} color="#94a3b8" />
          <Text style={styles.noLocationText}>No location data available</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation} disabled={isLoading}>
            <Ionicons name="refresh" size={16} color="#059669" />
            <Text style={styles.refreshButtonText}>Get Current Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  startButton: {
    borderColor: "#059669",
    backgroundColor: "rgba(5, 150, 105, 0.1)",
  },
  stopButton: {
    borderColor: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  startButtonText: {
    color: "#059669",
  },
  stopButtonText: {
    color: "#dc2626",
  },
  locationInfo: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#475569",
    fontFamily: "monospace",
    marginLeft: 8,
  },
  locationDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "rgba(5, 150, 105, 0.05)",
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#059669",
    marginLeft: 4,
  },
  noLocationContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    marginBottom: 16,
  },
})
