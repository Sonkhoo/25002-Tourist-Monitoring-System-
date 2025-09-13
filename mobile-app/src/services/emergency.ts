import { supabase } from "./supabase"
import { getCurrentLocation } from "./location"
import * as Notifications from "expo-notifications"

export interface EmergencyAlert {
  id?: number
  tourist_id: string
  type: "panic" | "medical" | "security" | "natural_disaster"
  latitude?: number
  longitude?: number
  title: string
  message: string
  severity: "critical" | "high" | "medium" | "low"
  priority: number
  status: "active" | "acknowledged" | "resolved"
  created_at?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const initializeEmergencySystem = async (): Promise<boolean> => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      console.warn("Notification permission not granted")
      return false
    }

    return true
  } catch (error) {
    console.error("Emergency system initialization error:", error)
    return false
  }
}

export const triggerPanicAlert = async (touristId: string, alertType: EmergencyAlert["type"] = "panic") => {
  try {
    // Get current location
    const location = await getCurrentLocation()
    if (!location) {
      throw new Error("Unable to get current location")
    }

    // Create emergency alert
    const emergencyAlert: EmergencyAlert = {
      tourist_id: touristId,
      type: alertType,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      title: getAlertTitle(alertType),
      message: getAlertMessage(alertType, location.coords.latitude, location.coords.longitude),
      severity: "critical",
      priority: 1,
      status: "active",
    }

    // Insert alert into database
    const { data: alertData, error: alertError } = await supabase
      .from("alerts")
      .insert([emergencyAlert])
      .select()
      .single()

    if (alertError) {
      throw alertError
    }

    // Get tourist information for emergency contacts
    const { data: touristData, error: touristError } = await supabase
      .from("tourists")
      .select("*")
      .eq("id", touristId)
      .single()

    if (touristError) {
      console.error("Tourist data error:", touristError)
    }

    // Send notifications to emergency contacts
    if (touristData) {
      await notifyEmergencyContacts(touristData, emergencyAlert)
    }

    // Send push notification to authorities (simulated)
    await notifyAuthorities(emergencyAlert)

    // Log communication attempts
    await logEmergencyCommunication(touristId, alertData.id, emergencyAlert)

    return alertData
  } catch (error) {
    console.error("Panic alert error:", error)
    throw error
  }
}

export const resolveEmergencyAlert = async (alertId: number, resolutionNotes?: string) => {
  try {
    const { error } = await supabase
      .from("alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq("id", alertId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Resolve alert error:", error)
    return false
  }
}

export const acknowledgeEmergencyAlert = async (alertId: number) => {
  try {
    const { error } = await supabase.from("alerts").update({ status: "acknowledged" }).eq("id", alertId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Acknowledge alert error:", error)
    return false
  }
}

const getAlertTitle = (type: EmergencyAlert["type"]): string => {
  switch (type) {
    case "panic":
      return "🚨 EMERGENCY ALERT"
    case "medical":
      return "🏥 MEDICAL EMERGENCY"
    case "security":
      return "🛡️ SECURITY ALERT"
    case "natural_disaster":
      return "🌪️ NATURAL DISASTER ALERT"
    default:
      return "⚠️ EMERGENCY ALERT"
  }
}

const getAlertMessage = (type: EmergencyAlert["type"], lat: number, lng: number): string => {
  const locationStr = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`

  switch (type) {
    case "panic":
      return `Tourist has triggered a panic alert and requires immediate assistance. ${locationStr}`
    case "medical":
      return `Tourist requires immediate medical assistance. ${locationStr}`
    case "security":
      return `Tourist is in a potentially dangerous security situation. ${locationStr}`
    case "natural_disaster":
      return `Tourist is affected by a natural disaster and needs help. ${locationStr}`
    default:
      return `Tourist requires emergency assistance. ${locationStr}`
  }
}

const notifyEmergencyContacts = async (tourist: any, alert: EmergencyAlert) => {
  try {
    const contacts: EmergencyContact[] = []

    if (tourist.emergency_contact_1) {
      contacts.push(tourist.emergency_contact_1)
    }
    if (tourist.emergency_contact_2) {
      contacts.push(tourist.emergency_contact_2)
    }

    for (const contact of contacts) {
      // In a real app, this would send SMS/call via a service like Twilio
      console.log(`Notifying emergency contact: ${contact.name} (${contact.phone})`)

      // Log the communication attempt
      await supabase.from("communications").insert({
        tourist_id: tourist.id,
        alert_id: alert.id,
        communication_type: "sms",
        recipient_identifier: contact.phone,
        message_content: `EMERGENCY: ${tourist.name} has triggered an emergency alert. Location: ${alert.latitude}, ${alert.longitude}. Please contact authorities immediately.`,
        status: "sent",
      })
    }
  } catch (error) {
    console.error("Emergency contact notification error:", error)
  }
}

const notifyAuthorities = async (alert: EmergencyAlert) => {
  try {
    // In a real app, this would integrate with local emergency services
    console.log("Notifying local authorities about emergency alert")

    // Send local push notification as simulation
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Emergency Alert Sent",
        body: "Authorities and emergency contacts have been notified of your emergency.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    })

    // Log authority notification
    await supabase.from("communications").insert({
      tourist_id: alert.tourist_id,
      alert_id: alert.id,
      communication_type: "push_notification",
      recipient_identifier: "local_authorities",
      message_content: alert.message,
      status: "sent",
    })
  } catch (error) {
    console.error("Authority notification error:", error)
  }
}

const logEmergencyCommunication = async (touristId: string, alertId: number, alert: EmergencyAlert) => {
  try {
    await supabase.from("communications").insert({
      tourist_id: touristId,
      alert_id: alertId,
      communication_type: "emergency_alert",
      recipient_identifier: "system",
      message_content: `Emergency alert triggered: ${alert.title} - ${alert.message}`,
      status: "processed",
    })
  } catch (error) {
    console.error("Communication logging error:", error)
  }
}

export const getEmergencyHistory = async (touristId: string) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("tourist_id", touristId)
      .in("type", ["panic", "medical", "security", "natural_disaster"])
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Emergency history error:", error)
    return []
  }
}

export const checkEmergencyStatus = async (touristId: string) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("tourist_id", touristId)
      .eq("status", "active")
      .in("type", ["panic", "medical", "security", "natural_disaster"])
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error("Emergency status check error:", error)
    return null
  }
}
