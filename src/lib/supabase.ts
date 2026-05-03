import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase.config';

const supabaseUrl = supabaseConfig.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = supabaseConfig.anonKey || 'placeholder-key';

// Check if credentials are configured
const isConfigured = supabaseConfig.url !== '' &&
                     supabaseConfig.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
                     supabaseConfig.url !== 'YOUR_SUPABASE_URL_HERE' &&
                     supabaseConfig.anonKey !== '' &&
                     supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
                     supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = isConfigured;

// Database Types
export interface Profile {
  id: string;
  email: string;
  role: 'staff' | 'manager' | 'admin';
  full_name: string;
  approved: boolean;
  created_at?: string;
}

export interface Participant {
  id?: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  township: string;
  township_other?: string;
  post_code: string;
  council_region: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  additional_requirements?: string;
  created_at?: string;
  // Cultural background (optional — added in later migrations)
  identify_aboriginal_tsi?: string;
  speak_other_language?: string;
  other_language_details?: string;
  country_of_birth?: string;
  cultural_identity?: string;
  cultural_identity_details?: string;
  // Postal address (optional — added in later migrations)
  postal_address_line1?: string;
  postal_address_line2?: string;
  postal_postcode?: string;
  // Other (optional)
  title?: string;
  home_tel?: string;
  lgbti_community?: string;
}

export interface Program {
  id?: string;
  name: string;
  description: string;
  days: string[]; // Array of days: ['Monday', 'Tuesday', etc.]
  start_time: string;
  end_time: string;
  capacity?: number;
  created_at?: string;
}

export interface ProgramEnrollment {
  id?: string;
  participant_id: string;
  program_id: string;
  enrolled_at?: string;
}

export interface AttendanceRecord {
  id?: string;
  program_id: string;
  participant_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at?: string;
}