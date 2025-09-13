"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import { Ionicons } from "@expo/vector-icons"
import { getCurrentLocation } from "../services/location"
import { getLastKnownLocation } from "../services/locationTracking"
import { supabase } from "../services/supabase"
import type * as Location from "expo-location"

interface Geofence {
  id: number
  name: string
  type: string
  center_lat: number
  center_lng: number
  risk_level: number
  description: string
}

interface Hazard {
  id: number
  title: string
  type: string
  center_lat: number
  center_lng: number
  radius_km: number
  severity: string
  description: string
}

const { width, height } = Dimensions.get("window")
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard")
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    loadMapData()
  }, [])

  const loadMapData = async () => {
    try {
      setIsLoading(true)

      // Get current location
      let location = getLastKnownLocation()
      if (!location) {
        location = await getCurrentLocation()
      }
      setCurrentLocation(location)

      // Load geofences
      const { data: geofenceData, error: geofenceError } = await supabase
        .from("geofences")
        .select("*")
        .eq("active", true)

      if (geofenceError) {
        console.error("Geofence loading error:", geofenceError)
      } else {
        setGeofences(geofenceData || [])
      }

      // Load hazards
      const { data: hazardData, error: hazardError } = await supabase.from("hazards").select("*").eq("status", "active")

      if (hazardError) {
        console.error("Hazard loading error:", hazardError)
      } else {
        setHazards(hazardData || [])
      }
    } catch (error) {
      console.error("Map data loading error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMyLocation = async () => {
    try {
      const location = await getCurrentLocation()
      if (location && mapRef.current) {
        setCurrentLocation(location)
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        })
      }
    } catch (error) {
      Alert.alert("Error", "Unable to get your current location")
    }
  }

  const toggleMapType = () => {
    setMapType(mapType === "standard" ? "satellite" : "standard")
  }

  const getGeofenceColor = (type: string, riskLevel: number) => {
    switch (type) {
      case "restricted":
        return "rgba(220, 38, 38, 0.3)" // Red
      case "safe":
        return "rgba(5, 150, 105, 0.3)" // Green
      case "hazard":
        return "rgba(217, 119, 6, 0.3)" // Orange
      default:
        return `rgba(220, 38, 38, ${0.1 + riskLevel * 0.1})` // Risk-based opacity
    }
  }

  const getGeofenceBorderColor = (type: string) => {
    switch (type) {
      case "restricted":
        return "#dc2626"
      case "safe":
        return "#059669"
      case "hazard":
        return "#d97706"
      default:
        return "#dc2626"
    }
  }

  const getHazardColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "rgba(220, 38, 38, 0.4)"
      case "medium":
        return "rgba(217, 119, 6, 0.4)"
      case "low":
        return "rgba(234, 179, 8, 0.4)"
      default:
        return "rgba(217, 119, 6, 0.4)"
    }
  }

  const getHazardBorderColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#dc2626"
      case "medium":
        return "#d97706"
      case "low":
        return "#eab308"
      default:
        return "#d97706"
    }
  }

  const handleGeofencePress = (geofence: Geofence) => {
    Alert.alert(
      geofence.name,
      `Type: ${geofence.type}\nRisk Level: ${geofence.risk_level}/5\n\n${geofence.description}`,
      [{ text: "OK" }],
    )
  }

  const handleHazardPress = (hazard: Hazard) => {
    Alert.alert(
      hazard.title,
      `Type: ${hazard.type}\nSeverity: ${hazard.severity}\nRadius: ${hazard.radius_km}km\n\n${hazard.description}`,
      [{ text: "OK" }],
    )
  }

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
    : {
        // Default to Northeast India region
        latitude: 26.2006,
        longitude: 92.9376,
        latitudeDelta: 2.0,
        longitudeDelta: 2.0,
      }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="Your Location"
            description="Current position"
            pinColor="#059669"
          />
        )}

        {/* Geofences */}
        {geofences.map((geofence) => (
          <Circle
            key={`geofence-${geofence.id}`}
            center={{
              latitude: geofence.center_lat,
              longitude: geofence.center_lng,
            }}
            radius={1000} // 1km radius for demo
            fillColor={getGeofenceColor(geofence.type, geofence.risk_level)}
            strokeColor={getGeofenceBorderColor(geofence.type)}
            strokeWidth={2}
            onPress={() => handleGeofencePress(geofence)}
          />
        ))}

        {/* Geofence markers */}
        {geofences.map((geofence) => (
          <Marker
            key={`geofence-marker-${geofence.id}`}
            coordinate={{
              latitude: geofence.center_lat,
              longitude: geofence.center_lng,
            }}
            title={geofence.name}
            description={geofence.description}
            onPress={() => handleGeofencePress(geofence)}
          >
            <View style={[styles.customMarker, { backgroundColor: getGeofenceBorderColor(geofence.type) }]}>
              <Ionicons
                name={
                  geofence.type === "safe" ? "shield-checkmark" : geofence.type === "restricted" ? "warning" : "alert"
                }
                size={16}
                color="#ffffff"
              />
            </View>
          </Marker>
        ))}

        {/* Hazards */}
        {hazards.map((hazard) => (
          <Circle
            key={`hazard-${hazard.id}`}
            center={{
              latitude: hazard.center_lat,
              longitude: hazard.center_lng,
            }}
            radius={hazard.radius_km * 1000} // Convert km to meters
            fillColor={getHazardColor(hazard.severity)}
            strokeColor={getHazardBorderColor(hazard.severity)}
            strokeWidth={2}
            lineDashPattern={[5, 5]}
            onPress={() => handleHazardPress(hazard)}
          />
        ))}

        {/* Hazard markers */}
        {hazards.map((hazard) => (
          <Marker
            key={`hazard-marker-${hazard.id}`}
            coordinate={{
              latitude: hazard.center_lat,
              longitude: hazard.center_lng,
            }}
            title={hazard.title}
            description={hazard.description}
            onPress={() => handleHazardPress(hazard)}
          >
            <View style={[styles.hazardMarker, { backgroundColor: getHazardBorderColor(hazard.severity) }]}>
              <Ionicons name="warning" size={20} color="#ffffff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleMyLocation}>
          <Ionicons name="locate" size={24} color="#059669" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Ionicons name={mapType === "standard" ? "satellite" : "map"} size={24} color="#059669" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={loadMapData}>
          <Ionicons name="refresh" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#059669" }]} />
            <Text style={styles.legendText}>Safe Zones</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#d97706" }]} />
            <Text style={styles.legendText}>Hazard Areas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#dc2626" }]} />
            <Text style={styles.legendText}>Restricted Zones</Text>
          </View>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: "absolute",
    top: 50,
    right: 16,
    flexDirection: "column",
  },
  controlButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legend: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  hazardMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
})
