"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native"
import { SafetyCard } from "../components/SafetyCard"
import { EmergencyButton } from "../components/EmergencyButton"
import { LocationStatus } from "../components/LocationStatus"
import { getCurrentLocation } from "../services/location"
import { initializeLocationTracking, startLocationTracking } from "../services/locationTracking"
import { triggerPanicAlert, initializeEmergencySystem } from "../services/emergency"

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false)
  const [safetyScore, setSafetyScore] = useState(75)
  const [currentLocation, setCurrentLocation] = useState<string>("Loading...")
  const [touristId, setTouristId] = useState<string>("demo-tourist-id") // In real app, get from auth

  useEffect(() => {
    loadHomeData()
    initializeTracking()
    initializeEmergencySystem()
  }, [])

  const initializeTracking = async () => {
    try {
      const initialized = await initializeLocationTracking()
      if (initialized) {
        await startLocationTracking(touristId)
      }
    } catch (error) {
      console.error("Tracking initialization error:", error)
    }
  }

  const loadHomeData = async () => {
    try {
      const location = await getCurrentLocation()
      if (location) {
        setCurrentLocation(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`)
      }
    } catch (error) {
      console.error("Load home data error:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadHomeData()
    setRefreshing(false)
  }

  const handleEmergency = async () => {
    try {
      const location = await getCurrentLocation()
      if (!location) {
        Alert.alert("Error", "Unable to get your location. Please try again.")
        return
      }

      await triggerPanicAlert(touristId, "panic")
      Alert.alert("Emergency Alert Sent", "Authorities and your emergency contacts have been notified.")
    } catch (error) {
      console.error("Emergency alert error:", error)
      Alert.alert("Error", "Failed to send emergency alert. Please try again.")
    }
  }

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "#059669"
    if (score >= 60) return "#d97706"
    return "#dc2626"
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to SafeTravel NE</Text>
        <Text style={styles.locationText}>Current Location: {currentLocation}</Text>
      </View>

      <LocationStatus touristId={touristId} />

      <View style={styles.safetyScoreContainer}>
        <Text style={styles.safetyScoreLabel}>Your Safety Score</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreText, { color: getSafetyScoreColor(safetyScore) }]}>{safetyScore}</Text>
          <Text style={styles.scoreSubText}>/ 100</Text>
        </View>
      </View>

      <EmergencyButton onPress={handleEmergency} />

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Safety Features</Text>

        <SafetyCard
          title="Safety Map"
          description="View safe zones, hazards, and real-time alerts"
          icon="map"
          color="#059669"
          onPress={() => navigation.navigate("Map")}
        />

        <SafetyCard
          title="Active Alerts"
          description="Check current safety alerts in your area"
          icon="notifications"
          color="#d97706"
          onPress={() => navigation.navigate("Alerts")}
        />

        <SafetyCard
          title="Emergency Contacts"
          description="Manage your emergency contact information"
          icon="people"
          color="#0891b2"
          onPress={() => navigation.navigate("Profile")}
        />

        <SafetyCard
          title="Cultural Guide"
          description="Learn about local customs and essential phrases"
          icon="book"
          color="#7c3aed"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#059669",
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  safetyScoreContainer: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  safetyScoreLabel: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  scoreSubText: {
    fontSize: 14,
    color: "#64748b",
  },
  featuresContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#475569",
    marginHorizontal: 16,
    marginBottom: 8,
  },
})
