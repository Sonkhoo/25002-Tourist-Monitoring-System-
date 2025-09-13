"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

interface EmergencyButtonProps {
  onPress: () => void
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false)

  const handlePress = () => {
    Alert.alert(
      "Emergency Alert",
      "Are you sure you want to send an emergency alert? This will notify authorities and your emergency contacts.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send Alert",
          style: "destructive",
          onPress: onPress,
        },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#dc2626", "#b91c1c"]} style={[styles.gradient, isPressed && styles.pressed]}>
          <Ionicons name="warning" size={32} color="#ffffff" />
          <Text style={styles.buttonText}>EMERGENCY</Text>
          <Text style={styles.subText}>Tap to Alert</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    shadowColor: "#dc2626",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  subText: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
})
