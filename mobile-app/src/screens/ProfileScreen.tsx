"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase, type Tourist } from "../services/supabase"
import { BlockchainIdentityCard } from "../components/BlockchainIdentityCard"
import { createBlockchainIdentity, getBlockchainTransactions } from "../services/blockchain"

export default function ProfileScreen() {
  const [tourist, setTourist] = useState<Tourist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingIdentity, setIsCreatingIdentity] = useState(false)

  useEffect(() => {
    loadTouristProfile()
  }, [])

  const loadTouristProfile = async () => {
    try {
      // In a real app, you'd get the tourist ID from authentication or local storage
      // For demo purposes, we'll get the first tourist
      const { data, error } = await supabase.from("tourists").select("*").limit(1).single()

      if (error) {
        console.error("Load profile error:", error)
        return
      }

      setTourist(data)
    } catch (error) {
      console.error("Load profile error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBlockchainIdentity = async () => {
    if (!tourist) return

    Alert.alert(
      "Create Blockchain Identity",
      "This will create a secure, immutable digital identity on the blockchain. This process may take a few moments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async () => {
            setIsCreatingIdentity(true)
            try {
              await createBlockchainIdentity(tourist.id, tourist)
              await loadTouristProfile() // Reload to get updated blockchain data
              Alert.alert("Success", "Your blockchain identity has been created successfully!")
            } catch (error) {
              console.error("Create blockchain identity error:", error)
              Alert.alert("Error", "Failed to create blockchain identity. Please try again.")
            } finally {
              setIsCreatingIdentity(false)
            }
          },
        },
      ],
    )
  }

  const handleViewTransactions = async () => {
    if (!tourist) return

    try {
      const transactions = await getBlockchainTransactions(tourist.id)
      const transactionList = transactions
        .map((tx) => `${tx.type}: ${tx.hash.substring(0, 10)}... (${tx.status})`)
        .join("\n")

      Alert.alert("Blockchain Transactions", transactions.length > 0 ? transactionList : "No transactions found", [
        { text: "OK" },
      ])
    } catch (error) {
      console.error("View transactions error:", error)
      Alert.alert("Error", "Failed to load blockchain transactions.")
    }
  }

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing feature coming soon!")
  }

  const handleEmergencyContacts = () => {
    Alert.alert("Emergency Contacts", "Emergency contacts management coming soon!")
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => {} },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    )
  }

  if (!tourist) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No profile found</Text>
      </View>
    )
  }

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "#059669"
    if (score >= 60) return "#d97706"
    return "#dc2626"
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{tourist.name}</Text>
            <Text style={styles.userPhone}>{tourist.phone}</Text>
            <Text style={styles.userEmail}>{tourist.email}</Text>
          </View>
        </View>

        <View style={styles.safetyBadge}>
          <Text style={styles.safetyLabel}>Safety Score</Text>
          <Text style={[styles.safetyScore, { color: getSafetyScoreColor(tourist.safety_score) }]}>
            {tourist.safety_score}
          </Text>
        </View>
      </View>

      {/* Blockchain Identity Section */}
      <BlockchainIdentityCard touristId={tourist.id} blockchainAddress={tourist.blockchain_address} />

      {!tourist.blockchain_address && (
        <View style={styles.blockchainActions}>
          <TouchableOpacity
            style={[styles.createIdentityButton, isCreatingIdentity && styles.disabledButton]}
            onPress={handleCreateBlockchainIdentity}
            disabled={isCreatingIdentity}
          >
            <Ionicons name="diamond" size={20} color="#ffffff" />
            <Text style={styles.createIdentityButtonText}>
              {isCreatingIdentity ? "Creating Identity..." : "Create Blockchain Identity"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nationality</Text>
              <Text style={styles.infoValue}>{tourist.nationality}</Text>
            </View>
            {tourist.passport_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Passport</Text>
                <Text style={styles.infoValue}>{tourist.passport_number}</Text>
              </View>
            )}
            {tourist.blood_group && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Blood Group</Text>
                <Text style={styles.infoValue}>{tourist.blood_group}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entry Date</Text>
              <Text style={styles.infoValue}>
                {tourist.entry_date ? new Date(tourist.entry_date).toLocaleDateString() : "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Visit Purpose</Text>
              <Text style={styles.infoValue}>{tourist.visit_purpose || "Not specified"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.infoCard}>
            {tourist.emergency_contact_1 && (
              <View style={styles.emergencyContact}>
                <Text style={styles.contactName}>{tourist.emergency_contact_1.name}</Text>
                <Text style={styles.contactPhone}>{tourist.emergency_contact_1.phone}</Text>
                <Text style={styles.contactRelation}>{tourist.emergency_contact_1.relationship}</Text>
              </View>
            )}
            {tourist.emergency_contact_2 && (
              <View style={[styles.emergencyContact, styles.emergencyContactBorder]}>
                <Text style={styles.contactName}>{tourist.emergency_contact_2.name}</Text>
                <Text style={styles.contactPhone}>{tourist.emergency_contact_2.phone}</Text>
                <Text style={styles.contactRelation}>{tourist.emergency_contact_2.relationship}</Text>
              </View>
            )}
          </View>
        </View>

        {tourist.medical_conditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.medicalText}>{tourist.medical_conditions}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#059669" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleEmergencyContacts}>
            <Ionicons name="people-outline" size={20} color="#059669" />
            <Text style={styles.actionButtonText}>Manage Emergency Contacts</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {tourist.blockchain_address && (
            <TouchableOpacity style={styles.actionButton} onPress={handleViewTransactions}>
              <Ionicons name="list-outline" size={20} color="#059669" />
              <Text style={styles.actionButtonText}>View Blockchain Transactions</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#059669",
    padding: 20,
    paddingTop: 40,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.8,
  },
  safetyBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  safetyLabel: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 4,
  },
  safetyScore: {
    fontSize: 32,
    fontWeight: "bold",
  },
  blockchainActions: {
    padding: 16,
  },
  createIdentityButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createIdentityButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  emergencyContact: {
    paddingVertical: 12,
  },
  emergencyContactBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 12,
    paddingTop: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#059669",
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: "#64748b",
  },
  medicalText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  actionButton: {
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
  actionButtonText: {
    fontSize: 16,
    color: "#475569",
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutText: {
    color: "#dc2626",
  },
})
