"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase, type Alert as AlertType } from "../services/supabase"
import { getNotifications, markNotificationAsRead, type NotificationData } from "../services/notifications"

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"alerts" | "notifications">("alerts")
  const [touristId] = useState("demo-tourist-id") // In real app, get from auth

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      if (activeTab === "alerts") {
        await loadAlerts()
      } else {
        await loadNotifications()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .in("status", ["active", "acknowledged"])
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Load alerts error:", error)
        return
      }

      setAlerts(data || [])
    } catch (error) {
      console.error("Load alerts error:", error)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(touristId)
      setNotifications(data)
    } catch (error) {
      console.error("Load notifications error:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleAlertPress = (alert: AlertType) => {
    Alert.alert(
      alert.title,
      `${alert.message}\n\nSeverity: ${alert.severity}\nType: ${alert.type}\nCreated: ${new Date(
        alert.created_at || "",
      ).toLocaleString()}`,
      [{ text: "OK" }],
    )
  }

  const handleNotificationPress = async (notification: NotificationData) => {
    // Mark as read if not already
    if (notification.status !== "read" && notification.id) {
      await markNotificationAsRead(notification.id)
      // Reload notifications to update status
      await loadNotifications()
    }

    Alert.alert(
      notification.title,
      `${notification.message}\n\nType: ${notification.type}\nPriority: ${notification.priority}\nCreated: ${new Date(
        notification.sent_at || "",
      ).toLocaleString()}`,
      [{ text: "OK" }],
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "panic":
        return "warning"
      case "geofence":
        return "location"
      case "hazard":
        return "alert-circle"
      case "anomaly":
        return "analytics"
      case "weather":
        return "cloudy"
      case "emergency":
        return "medical"
      default:
        return "notifications"
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#d97706"
      case "low":
        return "#059669"
      default:
        return "#64748b"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "normal":
        return "#d97706"
      case "low":
        return "#059669"
      default:
        return "#64748b"
    }
  }

  const getSeverityBadgeStyle = (severity: string) => {
    const color = getAlertColor(severity)
    return {
      backgroundColor: `${color}20`,
      borderColor: color,
    }
  }

  const getPriorityBadgeStyle = (priority: string) => {
    const color = getPriorityColor(priority)
    return {
      backgroundColor: `${color}20`,
      borderColor: color,
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const renderAlert = ({ item }: { item: AlertType }) => (
    <TouchableOpacity style={styles.alertCard} onPress={() => handleAlertPress(item)}>
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons name={getAlertIcon(item.type) as any} size={20} color={getAlertColor(item.severity)} />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        <View style={styles.alertMeta}>
          <View style={[styles.severityBadge, getSeverityBadgeStyle(item.severity)]}>
            <Text style={[styles.severityText, { color: getAlertColor(item.severity) }]}>{item.severity}</Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(item.created_at || "")}</Text>
        </View>
      </View>

      {item.status === "active" && (
        <View style={styles.activeIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeText}>Active Alert</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderNotification = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[styles.alertCard, item.status !== "read" && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons name={getAlertIcon(item.type) as any} size={20} color={getPriorityColor(item.priority)} />
        </View>
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, item.status !== "read" && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        <View style={styles.alertMeta}>
          <View style={[styles.severityBadge, getPriorityBadgeStyle(item.priority)]}>
            <Text style={[styles.severityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(item.sent_at || "")}</Text>
          {item.status !== "read" && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyTitle}>{activeTab === "alerts" ? "No Active Alerts" : "No Notifications"}</Text>
      <Text style={styles.emptyMessage}>
        {activeTab === "alerts"
          ? "You're all caught up! No safety alerts in your area at the moment."
          : "No notifications to display at this time."}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety Alerts & Notifications</Text>
        <Text style={styles.headerSubtitle}>Stay informed about safety conditions</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
          onPress={() => setActiveTab("alerts")}
        >
          <Text style={[styles.tabText, activeTab === "alerts" && styles.activeTabText]}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notifications" && styles.activeTab]}
          onPress={() => setActiveTab("notifications")}
        >
          <Text style={[styles.tabText, activeTab === "notifications" && styles.activeTabText]}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "alerts" ? alerts : notifications}
        renderItem={activeTab === "alerts" ? renderAlert : renderNotification}
        keyExtractor={(item) => item.id?.toString() || ""}
        contentContainerStyle={
          (activeTab === "alerts" ? alerts : notifications).length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#059669",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  activeTabText: {
    color: "#ffffff",
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  alertCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "700",
  },
  alertMessage: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  alertMeta: {
    alignItems: "flex-end",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  timeText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
    marginTop: 4,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc2626",
    marginRight: 8,
  },
  activeText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
})
