"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../services/supabase"
import { getCurrentLocation } from "../services/location"
import { useRegistration } from "../context/RegistrationContext"

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export default function RegisterScreen({ navigation }: any) {
  const { setIsRegistered } = useRegistration()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "Indian",
    passportNumber: "",
    aadhaarLast4: "",
    entryPoint: "",
    visitPurpose: "",
    plannedExitDate: "",
    medicalConditions: "",
    bloodGroup: "",
  })

  const [emergencyContact1, setEmergencyContact1] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  })

  const [emergencyContact2, setEmergencyContact2] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  const relationships = ["Parent", "Spouse", "Sibling", "Friend", "Colleague", "Other"]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmergencyContact1Change = (field: keyof EmergencyContact, value: string) => {
    setEmergencyContact1((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmergencyContact2Change = (field: keyof EmergencyContact, value: string) => {
    setEmergencyContact2((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your full name")
      return false
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number")
      return false
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!emergencyContact1.name.trim() || !emergencyContact1.phone.trim()) {
      Alert.alert("Error", "Please provide at least one emergency contact")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRegister = async () => {
    if (!validateStep1() || !validateStep2()) return

    setIsLoading(true)
    try {
      const location = await getCurrentLocation()

      const touristData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        nationality: formData.nationality,
        passport_number: formData.passportNumber || null,
        aadhaar_last_4: formData.aadhaarLast4 || null,
        entry_point: formData.entryPoint || null,
        visit_purpose: formData.visitPurpose || null,
        planned_exit_date: formData.plannedExitDate || null,
        medical_conditions: formData.medicalConditions || null,
        blood_group: formData.bloodGroup || null,
        emergency_contact_1: {
          name: emergencyContact1.name,
          phone: emergencyContact1.phone,
          relationship: emergencyContact1.relationship,
        },
        emergency_contact_2:
          emergencyContact2.name && emergencyContact2.phone
            ? {
                name: emergencyContact2.name,
                phone: emergencyContact2.phone,
                relationship: emergencyContact2.relationship,
              }
            : null,
        safety_score: 50,
        risk_category: "medium",
        status: "active",
      }

      const { data, error } = await supabase.from("tourists").insert([touristData]).select().single()

      if (error) {
        throw error
      }

      // Log initial location if available
      if (location && data) {
        await supabase.from("location_logs").insert({
          tourist_id: data.id,
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: location.altitude,
          accuracy: location.accuracy,
          speed: location.speed,
          timestamp: new Date().toISOString(),
        })
      }

      Alert.alert("Success", "Registration completed successfully!", [
        {
          text: "OK",
          onPress: () => {
            setIsRegistered(true)
            navigation.replace("Main")
          },
        },
      ])
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Error", "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
          placeholder="Enter your full name"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
          placeholder="+91 9876543210"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
          placeholder="your.email@example.com"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nationality</Text>
        <TextInput
          style={styles.input}
          value={formData.nationality}
          onChangeText={(value) => handleInputChange("nationality", value)}
          placeholder="Indian"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Passport Number</Text>
          <TextInput
            style={styles.input}
            value={formData.passportNumber}
            onChangeText={(value) => handleInputChange("passportNumber", value)}
            placeholder="Optional"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Aadhaar (Last 4)</Text>
          <TextInput
            style={styles.input}
            value={formData.aadhaarLast4}
            onChangeText={(value) => handleInputChange("aadhaarLast4", value)}
            placeholder="1234"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Emergency Contacts</Text>

      <Text style={styles.sectionSubtitle}>Primary Emergency Contact *</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact1.name}
          onChangeText={(value) => handleEmergencyContact1Change("name", value)}
          placeholder="Contact person name"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact1.phone}
          onChangeText={(value) => handleEmergencyContact1Change("phone", value)}
          placeholder="+91 9876543210"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Relationship</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {relationships.map((relationship) => (
            <TouchableOpacity
              key={relationship}
              style={[styles.chip, emergencyContact1.relationship === relationship && styles.chipSelected]}
              onPress={() => handleEmergencyContact1Change("relationship", relationship)}
            >
              <Text
                style={[styles.chipText, emergencyContact1.relationship === relationship && styles.chipTextSelected]}
              >
                {relationship}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionSubtitle}>Secondary Emergency Contact (Optional)</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact2.name}
          onChangeText={(value) => handleEmergencyContact2Change("name", value)}
          placeholder="Contact person name"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact2.phone}
          onChangeText={(value) => handleEmergencyContact2Change("phone", value)}
          placeholder="+91 9876543210"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Travel & Medical Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Entry Point</Text>
        <TextInput
          style={styles.input}
          value={formData.entryPoint}
          onChangeText={(value) => handleInputChange("entryPoint", value)}
          placeholder="e.g., Guwahati Airport"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Visit Purpose</Text>
        <TextInput
          style={styles.input}
          value={formData.visitPurpose}
          onChangeText={(value) => handleInputChange("visitPurpose", value)}
          placeholder="e.g., Tourism, Business"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Planned Exit Date</Text>
        <TextInput
          style={styles.input}
          value={formData.plannedExitDate}
          onChangeText={(value) => handleInputChange("plannedExitDate", value)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {bloodGroups.map((group) => (
            <TouchableOpacity
              key={group}
              style={[styles.chip, formData.bloodGroup === group && styles.chipSelected]}
              onPress={() => handleInputChange("bloodGroup", group)}
            >
              <Text style={[styles.chipText, formData.bloodGroup === group && styles.chipTextSelected]}>{group}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Medical Conditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.medicalConditions}
          onChangeText={(value) => handleInputChange("medicalConditions", value)}
          placeholder="Any medical conditions, allergies, or medications"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tourist Registration</Text>
        <Text style={styles.headerSubtitle}>Step {currentStep} of 3</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color="#475569" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={currentStep === 3 ? handleRegister : handleNext}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? "Registering..." : currentStep === 3 ? "Complete Registration" : "Next"}
          </Text>
          {!isLoading && <Ionicons name="chevron-forward" size={20} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
    marginTop: -2,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginTop: 20,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#475569",
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  chipContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipSelected: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  chipText: {
    fontSize: 14,
    color: "#475569",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#475569",
    marginLeft: 4,
  },
  nextButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
})
