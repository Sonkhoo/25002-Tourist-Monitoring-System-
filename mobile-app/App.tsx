"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { View, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Screens
import HomeScreen from "./src/screens/HomeScreen"
import MapScreen from "./src/screens/MapScreen"
import EmergencyScreen from "./src/screens/EmergencyScreen"
import ProfileScreen from "./src/screens/ProfileScreen"
import RegisterScreen from "./src/screens/RegisterScreen"
import AlertsScreen from "./src/screens/AlertsScreen"
import { initializeLocation } from "./src/services/location"
import { initializeNotifications } from "./src/services/notifications"
import { NotificationBadge } from "./src/components/NotificationBadge"
import { RegistrationProvider, useRegistration } from "./src/context/RegistrationContext"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const TabNavigator = () => {
  const touristId = "demo-tourist-id" // In real app, get from auth

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "Emergency") {
            iconName = focused ? "warning" : "warning-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "help-outline"
          }

          const iconComponent = <Ionicons name={iconName} size={size} color={color} />

          // Add notification badge to Emergency tab
          if (route.name === "Emergency") {
            return (
              <View>
                {iconComponent}
                <NotificationBadge touristId={touristId} />
              </View>
            )
          }

          return iconComponent
        },
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#475569",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#059669",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "SafeTravel NE" }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Safety Map" }} />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          title: "Emergency",
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  )
}

function AppContent() {
  const { isRegistered } = useRegistration()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Initialize location services
      await initializeLocation()

      // Initialize notifications
      await initializeNotifications()
    } catch (error) {
      console.error("App initialization error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#059669" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isRegistered ? (
          <Stack.Screen name="Register" component={RegisterScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Alerts"
              component={AlertsScreen}
              options={{
                headerShown: true,
                title: "Safety Alerts",
                headerStyle: { backgroundColor: "#059669" },
                headerTintColor: "#ffffff",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <RegistrationProvider>
      <AppContent />
    </RegistrationProvider>
  )
}
