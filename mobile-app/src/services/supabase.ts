import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "your-supabase-url"
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema
export interface Tourist {
  id: string
  blockchain_address?: string
  blockchain_hash?: string
  nft_token_id?: number
  phone: string
  name: string
  nationality: string
  passport_number?: string
  aadhaar_last_4?: string
  email?: string
  profile_photo_ipfs?: string
  entry_point?: string
  entry_date?: string
  planned_exit_date?: string
  visit_purpose?: string
  planned_destinations?: any
  emergency_contact_1?: any
  emergency_contact_2?: any
  medical_conditions?: string
  blood_group?: string
  safety_score: number
  risk_category: string
  status: string
  last_check_in?: string
  created_at?: string
  updated_at?: string
}

export interface LocationLog {
  id: number
  tourist_id: string
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  speed?: number
  battery_level?: number
  network_type?: string
  timestamp?: string
}

export interface Alert {
  id: number
  tourist_id: string
  type: string
  category?: string
  latitude?: number
  longitude?: number
  title: string
  message: string
  severity: string
  priority: number
  status: string
  created_at?: string
  resolved_at?: string
}
