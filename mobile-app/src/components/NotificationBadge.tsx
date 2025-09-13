"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { getUnreadNotificationCount } from "../services/notifications"

interface NotificationBadgeProps {
  touristId: string
  style?: any
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ touristId, style }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [touristId])

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(touristId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Load unread count error:", error)
    }
  }

  if (unreadCount === 0) {
    return null
  }

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount.toString()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 1,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
})
