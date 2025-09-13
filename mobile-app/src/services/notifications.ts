import * as Notifications from "expo-notifications"
import { supabase } from "./supabase"
import { getCurrentLocation } from "./location"

export interface NotificationData {
  id?: number
  tourist_id: string
  type: "safety_alert" | "geofence" | "hazard" | "weather" | "emergency" | "system"
  title: string
  message: string
  priority: "low" | "normal" | "high" | "critical"
  data?: any
  scheduled_for?: string
  sent_at?: string
  status: "pending" | "sent" | "failed" | "read"
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const priority = notification.request.content.data?.priority || "normal"

    return {
      shouldShowAlert: true,
      shouldPlaySound: priority === "high" || priority === "critical",
      shouldSetBadge: true,
    }
  },
})

export const initializeNotifications = async (): Promise<boolean> => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permission not granted")
      return false
    }

    // Set up notification categories for different types
    await Notifications.setNotificationCategoryAsync("safety_alert", [
      {
        identifier: "acknowledge",
        buttonTitle: "Acknowledge",
        options: { opensAppToForeground: false },
      },
      {
        identifier: "view_details",
        buttonTitle: "View Details",
        options: { opensAppToForeground: true },
      },
    ])

    await Notifications.setNotificationCategoryAsync("emergency", [
      {
        identifier: "call_emergency",
        buttonTitle: "Call Emergency",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "view_location",
        buttonTitle: "View Location",
        options: { opensAppToForeground: true },
      },
    ])

    // Set up notification listeners
    setupNotificationListeners()

    return true
  } catch (error) {
    console.error("Notification initialization error:", error)
    return false
  }
}

const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received:", notification)
    // Update notification status in database
    updateNotificationStatus(notification.request.identifier, "read")
  })

  // Handle notification response (user tapped notification)
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification response:", response)
    handleNotificationResponse(response)
  })
}

const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
  const { notification, actionIdentifier } = response
  const notificationData = notification.request.content.data

  try {
    switch (actionIdentifier) {
      case "acknowledge":
        await acknowledgeAlert(notificationData?.alertId)
        break
      case "view_details":
        // Navigate to alert details (would need navigation context)
        break
      case "call_emergency":
        // Open phone dialer with emergency number
        break
      case "view_location":
        // Navigate to map screen
        break
      default:
        // Default tap action
        break
    }
  } catch (error) {
    console.error("Notification response handling error:", error)
  }
}

export const sendLocalNotification = async (notificationData: NotificationData) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.message,
        sound: notificationData.priority === "critical" || notificationData.priority === "high",
        priority: getNotificationPriority(notificationData.priority),
        categoryIdentifier: getNotificationCategory(notificationData.type),
        data: {
          ...notificationData.data,
          notificationId: notificationData.id,
          priority: notificationData.priority,
          type: notificationData.type,
        },
      },
      trigger: notificationData.scheduled_for ? new Date(notificationData.scheduled_for) : null,
    })

    // Update database with sent status
    await updateNotificationStatus(notificationId, "sent")

    return notificationId
  } catch (error) {
    console.error("Send local notification error:", error)
    await updateNotificationStatus(notificationData.id?.toString() || "", "failed")
    throw error
  }
}

export const createSafetyAlert = async (
  touristId: string,
  alertType: "geofence" | "hazard" | "weather",
  title: string,
  message: string,
  priority: NotificationData["priority"] = "normal",
  additionalData?: any,
) => {
  try {
    const location = await getCurrentLocation()

    const notificationData: NotificationData = {
      tourist_id: touristId,
      type: alertType,
      title,
      message,
      priority,
      status: "pending",
      data: {
        ...additionalData,
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }
          : null,
        timestamp: new Date().toISOString(),
      },
    }

    // Store in database
    const { data, error } = await supabase.from("notifications").insert([notificationData]).select().single()

    if (error) {
      throw error
    }

    // Send local notification
    await sendLocalNotification({ ...notificationData, id: data.id })

    return data
  } catch (error) {
    console.error("Create safety alert error:", error)
    throw error
  }
}

export const createGeofenceAlert = async (
  touristId: string,
  geofenceName: string,
  geofenceType: string,
  action: "entered" | "exited",
) => {
  const title = `Geofence ${action === "entered" ? "Entry" : "Exit"}`
  const message = `You have ${action} ${geofenceName} (${geofenceType} zone)`
  const priority = geofenceType === "restricted" ? "high" : "normal"

  return createSafetyAlert(touristId, "geofence", title, message, priority, {
    geofenceName,
    geofenceType,
    action,
  })
}

export const createHazardAlert = async (
  touristId: string,
  hazardTitle: string,
  hazardType: string,
  severity: string,
  distance: number,
) => {
  const title = `Hazard Alert: ${hazardTitle}`
  const message = `${hazardType} detected ${distance}km from your location. Severity: ${severity}`
  const priority = severity === "high" ? "critical" : severity === "medium" ? "high" : "normal"

  return createSafetyAlert(touristId, "hazard", title, message, priority, {
    hazardTitle,
    hazardType,
    severity,
    distance,
  })
}

export const createWeatherAlert = async (
  touristId: string,
  weatherType: string,
  severity: string,
  description: string,
) => {
  const title = `Weather Alert: ${weatherType}`
  const message = description
  const priority = severity === "severe" ? "high" : "normal"

  return createSafetyAlert(touristId, "weather", title, message, priority, {
    weatherType,
    severity,
  })
}

export const getNotifications = async (touristId: string, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("tourist_id", touristId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Get notifications error:", error)
    return []
  }
}

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const { error } = await supabase.from("notifications").update({ status: "read" }).eq("id", notificationId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return false
  }
}

export const getUnreadNotificationCount = async (touristId: string) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tourist_id", touristId)
      .neq("status", "read")

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    console.error("Get unread notification count error:", error)
    return 0
  }
}

export const clearAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.dismissAllNotificationsAsync()
    return true
  } catch (error) {
    console.error("Clear all notifications error:", error)
    return false
  }
}

const getNotificationPriority = (priority: NotificationData["priority"]) => {
  switch (priority) {
    case "critical":
      return Notifications.AndroidNotificationPriority.MAX
    case "high":
      return Notifications.AndroidNotificationPriority.HIGH
    case "normal":
      return Notifications.AndroidNotificationPriority.DEFAULT
    case "low":
      return Notifications.AndroidNotificationPriority.LOW
    default:
      return Notifications.AndroidNotificationPriority.DEFAULT
  }
}

const getNotificationCategory = (type: NotificationData["type"]) => {
  switch (type) {
    case "emergency":
      return "emergency"
    case "safety_alert":
    case "geofence":
    case "hazard":
    case "weather":
      return "safety_alert"
    default:
      return undefined
  }
}

const updateNotificationStatus = async (notificationId: string, status: NotificationData["status"]) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ status, sent_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) {
      console.error("Update notification status error:", error)
    }
  } catch (error) {
    console.error("Update notification status error:", error)
  }
}

const acknowledgeAlert = async (alertId: number) => {
  try {
    const { error } = await supabase.from("alerts").update({ status: "acknowledged" }).eq("id", alertId)

    if (error) {
      console.error("Acknowledge alert error:", error)
    }
  } catch (error) {
    console.error("Acknowledge alert error:", error)
  }
}

// Background notification processing
export const processBackgroundNotifications = async (touristId: string) => {
  try {
    // Check for new alerts that need notifications
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("tourist_id", touristId)
      .eq("status", "active")
      .is("notification_sent", null)

    if (error) {
      console.error("Background notification processing error:", error)
      return
    }

    for (const alert of alerts || []) {
      await createSafetyAlert(
        touristId,
        alert.type as any,
        alert.title,
        alert.message,
        alert.severity === "critical" ? "critical" : "high",
        { alertId: alert.id },
      )

      // Mark alert as notification sent
      await supabase.from("alerts").update({ notification_sent: true }).eq("id", alert.id)
    }
  } catch (error) {
    console.error("Background notification processing error:", error)
  }
}
