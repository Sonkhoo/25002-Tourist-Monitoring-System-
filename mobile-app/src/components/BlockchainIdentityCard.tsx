"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { verifyBlockchainIdentity, generateQRCode, type BlockchainIdentity } from "../services/blockchain"

interface BlockchainIdentityCardProps {
  touristId: string
  blockchainAddress?: string
}

export const BlockchainIdentityCard: React.FC<BlockchainIdentityCardProps> = ({ touristId, blockchainAddress }) => {
  const [identity, setIdentity] = useState<BlockchainIdentity | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (blockchainAddress) {
      loadIdentity()
    }
  }, [blockchainAddress])

  const loadIdentity = async () => {
    if (!blockchainAddress) return

    setIsLoading(true)
    try {
      const identityData = await verifyBlockchainIdentity(blockchainAddress)
      setIdentity(identityData)
    } catch (error) {
      console.error("Load identity error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowQR = () => {
    if (!identity) return

    const qrData = generateQRCode(identity)
    Alert.alert(
      "Digital Identity QR Code",
      "This QR code contains your verified digital identity information. Authorities can scan this to verify your identity and access your emergency contacts.",
      [
        { text: "Close", style: "cancel" },
        {
          text: "Show QR",
          onPress: () => setShowQR(true),
        },
      ],
    )
  }

  const handleVerifyIdentity = async () => {
    if (!identity) return

    Alert.alert(
      "Identity Verification",
      `Identity Status: ${identity.status}\nBlockchain Network: ${identity.network}\nToken ID: ${identity.tokenId}\nLast Verified: ${new Date().toLocaleString()}`,
      [{ text: "OK" }],
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#059669"
      case "minted":
        return "#0891b2"
      case "pending":
        return "#d97706"
      case "expired":
        return "#dc2626"
      default:
        return "#64748b"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return "checkmark-circle"
      case "minted":
        return "diamond"
      case "pending":
        return "time"
      case "expired":
        return "warning"
      default:
        return "help-circle"
    }
  }

  if (!blockchainAddress) {
    return (
      <View style={styles.container}>
        <View style={styles.noIdentityCard}>
          <Ionicons name="link-outline" size={32} color="#94a3b8" />
          <Text style={styles.noIdentityTitle}>No Blockchain Identity</Text>
          <Text style={styles.noIdentityMessage}>
            Your digital identity hasn't been created yet. Complete registration to generate your secure blockchain
            identity.
          </Text>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading blockchain identity...</Text>
        </View>
      </View>
    )
  }

  if (!identity) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={32} color="#dc2626" />
          <Text style={styles.errorTitle}>Identity Not Found</Text>
          <Text style={styles.errorMessage}>Unable to verify blockchain identity. Please try again later.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#059669", "#0891b2"]} style={styles.identityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <Ionicons name={getStatusIcon(identity.status) as any} size={16} color="#ffffff" />
            <Text style={styles.statusText}>{identity.status.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.qrButton} onPress={handleShowQR}>
            <Ionicons name="qr-code" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.identityTitle}>Digital Tourist Identity</Text>
          <Text style={styles.identityName}>{identity.metadata.name}</Text>
          <Text style={styles.identityNationality}>{identity.metadata.nationality}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.identityDetails}>
            <Text style={styles.detailLabel}>Token ID</Text>
            <Text style={styles.detailValue}>#{identity.tokenId}</Text>
          </View>
          <View style={styles.identityDetails}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{identity.network}</Text>
          </View>
          <View style={styles.identityDetails}>
            <Text style={styles.detailLabel}>Entry Date</Text>
            <Text style={styles.detailValue}>{new Date(identity.metadata.entryDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Blockchain Address</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {identity.address}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleVerifyIdentity}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.actionButtonText}>Verify Identity</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShowQR}>
          <Ionicons name="qr-code" size={20} color="#059669" />
          <Text style={styles.actionButtonText}>Show QR Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={16} color="#059669" />
        <Text style={styles.infoText}>
          Your blockchain identity is secured and immutable. Emergency contacts and critical information are stored
          securely on the blockchain for verification by authorities.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  identityCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  qrButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  cardContent: {
    marginBottom: 20,
  },
  identityTitle: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  identityName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  identityNationality: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  identityDetails: {
    alignItems: "center",
  },
  detailLabel: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  addressContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  addressLabel: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  addressText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "monospace",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    color: "#059669",
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  noIdentityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
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
  noIdentityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    marginTop: 12,
    marginBottom: 8,
  },
  noIdentityMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
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
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  errorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
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
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dc2626",
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
})
