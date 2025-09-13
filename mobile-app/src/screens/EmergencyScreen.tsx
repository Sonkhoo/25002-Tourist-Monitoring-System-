"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import {
  triggerPanicAlert,
  initializeEmergencySystem,
  getEmergencyHistory,
  checkEmergencyStatus,
  type EmergencyAlert,
} from "../services/emergency"
import { getCurrentLocation } from "../services/location"

export default function EmergencyScreen() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null)
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyAlert[]>([])
  const [touristId] = useState("demo-tourist-id") // In real app, get from auth
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    initializeScreen()
  }, [])

  const initializeScreen = async () => {
    try {
      await initializeEmergencySystem()
      await checkActiveEmergency()
      await loadEmergencyHistory()
    } catch (error) {
      console.error("Emergency screen initialization error:", error)
    }
  }

  const checkActiveEmergency = async () => {
    try {
      const activeEmergency = await checkEmergencyStatus(touristId)
      setActiveAlert(activeEmergency)
      setIsEmergencyActive(!!activeEmergency)
    } catch (error) {
      console.error("Check active emergency error:", error)
    }
  }

  const loadEmergencyHistory = async () => {
    try {
      const history = await getEmergencyHistory(touristId)
      setEmergencyHistory(history)
    } catch (error) {
      console.error("Load emergency history error:", error)
    }
  }

  const handlePanicAlert = (alertType: EmergencyAlert["type"] = "panic") => {
    Alert.alert(
      "Emergency Alert",
      `Are you sure you want to send a ${alertType} alert? This will immediately notify authorities and your emergency contacts.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send Alert",
          style: "destructive",
          onPress: () => sendEmergencyAlert(alertType),
        },
      ],
    )
  }

  const sendEmergencyAlert = async (alertType: EmergencyAlert["type"]) => {
    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      if (!location) {
        Alert.alert("Error", "Unable to get your location. Please try again.")
        return
      }

      const alert = await triggerPanicAlert(touristId, alertType)
      setActiveAlert(alert)
      setIsEmergencyActive(true)

      Alert.alert(
        "Emergency Alert Sent",
        "Your emergency alert has been sent successfully. Authorities and your emergency contacts have been notified.",
        [{ text: "OK" }],
      )

      await loadEmergencyHistory()
    } catch (error) {
      console.error("Send emergency alert error:", error)
      Alert.alert("Error", "Failed to send emergency alert. Please try again or call emergency services directly.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCallEmergency = (number: string) => {
    Alert.alert("Call Emergency Services", `Do you want to call ${number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => {
          Linking.openURL(`tel:${number}`)
        },
      },
    ])
  }

  const formatAlertTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "panic":
        return "warning"
      case "medical":
        return "medical"
      case "security":
        return "shield"
      case "natural_disaster":
        return "thunderstorm"
      default:
        return "alert-circle"
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "panic":
        return "#dc2626"
      case "medical":
        return "#dc2626"
      case "security":
        return "#ea580c"
      case "natural_disaster":
        return "#d97706"
      default:
        return "#dc2626"
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* Active Emergency Status */}
      {isEmergencyActive && activeAlert && (
        <View style={styles.activeEmergencyBanner}>
          <View style={styles.pulseDot} />
          <View style={styles.activeEmergencyContent}>
            <Text style={styles.activeEmergencyTitle}>ACTIVE EMERGENCY</Text>
            <Text style={styles.activeEmergencyMessage}>
              {activeAlert.title} - {formatAlertTime(activeAlert.created_at || "")}
            </Text>
          </View>
        </View>
      )}

      {/* Emergency Buttons */}
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>Emergency Actions</Text>

        <TouchableOpacity
          style={styles.panicButton}
          onPress={() => handlePanicAlert("panic")}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={["#dc2626", "#b91c1c"]} style={styles.panicGradient}>
            <Ionicons name="warning" size={32} color="#ffffff" />
            <Text style={styles.panicButtonText}>PANIC ALERT</Text>
            <Text style={styles.panicButtonSubtext}>Immediate Help Needed</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.emergencyButtonsGrid}>
          <TouchableOpacity
            style={styles.emergencyTypeButton}
            onPress={() => handlePanicAlert("medical")}
            disabled={isLoading}
          >
            <Ionicons name="medical" size={24} color="#dc2626" />
            <Text style={styles.emergencyTypeText}>Medical Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyTypeButton}
            onPress={() => handlePanicAlert("security")}
            disabled={isLoading}
          >
            <Ionicons name="shield" size={24} color="#ea580c" />
            <Text style={styles.emergencyTypeText}>Security Threat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyTypeButton}
            onPress={() => handlePanicAlert("natural_disaster")}
            disabled={isLoading}
          >
            <Ionicons name="thunderstorm" size={24} color="#d97706" />
            <Text style={styles.emergencyTypeText}>Natural Disaster</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.contactsSection}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>

        <TouchableOpacity style={styles.contactButton} onPress={() => handleCallEmergency("100")}>
          <View style={styles.contactIcon}>
            <Ionicons name="call" size={20} color="#ffffff" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Police</Text>
            <Text style={styles.contactNumber}>100</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={() => handleCallEmergency("102")}>
          <View style={styles.contactIcon}>
            <Ionicons name="medical" size={20} color="#ffffff" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Ambulance</Text>
            <Text style={styles.contactNumber}>102</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={() => handleCallEmergency("101")}>
          <View style={styles.contactIcon}>
            <Ionicons name="flame" size={20} color="#ffffff" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Fire Department</Text>
            <Text style={styles.contactNumber}>101</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={() => handleCallEmergency("1091")}>
          <View style={styles.contactIcon}>
            <Ionicons name="people" size={20} color="#ffffff" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Women Helpline</Text>
            <Text style={styles.contactNumber}>1091</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Emergency History */}
      {emergencyHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Emergency Alerts</Text>
          {emergencyHistory.slice(0, 3).map((alert) => (
            <View key={alert.id} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: getAlertTypeColor(alert.type) }]}>
                <Ionicons name={getAlertTypeIcon(alert.type) as any} size={16} color="#ffffff" />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>{alert.title}</Text>
                <Text style={styles.historyTime}>{formatAlertTime(alert.created_at || "")}</Text>
                <Text style={styles.historyStatus}>Status: {alert.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Emergency Safety Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color="#059669" />
          <Text style={styles.tipText}>
            Stay calm and provide clear information about your location and situation when help arrives.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="location" size={20} color="#059669" />
          <Text style={styles.tipText}>
            Your location is automatically shared with emergency services when you trigger an alert.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="people" size={20} color="#059669" />
          <Text style={styles.tipText}>
            Your emergency contacts will be notified immediately via SMS and phone calls.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  activeEmergencyBanner: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    marginRight: 12,
  },
  activeEmergencyContent: {
    flex: 1,
  },
  activeEmergencyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  activeEmergencyMessage: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  emergencySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 16,
  },
  panicButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#dc2626",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  panicGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  panicButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
  },
  panicButtonSubtext: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    marginTop: 4,
  },
  emergencyButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emergencyTypeButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
    marginTop: 8,
    textAlign: "center",
  },
  contactsSection: {
    padding: 16,
  },
  contactButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: "#64748b",
  },
  historySection: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  historyStatus: {
    fontSize: 12,
    color: "#059669",
    textTransform: "capitalize",
  },
  tipsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  tipCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
})
