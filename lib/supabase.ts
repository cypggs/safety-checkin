import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// DATABASE TYPES
// ============================================

export interface User {
  id: string;
  device_fingerprint: string;
  name: string; // Encrypted
  emergency_email: string; // Encrypted
  language: 'zh' | 'en';
  grace_period_days: number;
  last_checkin_at: string | null;
  checkin_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  checked_in_at: string;
  user_agent?: string;
  ip_address?: string;
}

export interface Alert {
  id: string;
  user_id: string;
  sent_at: string;
  method: 'email' | 'sms' | 'wechat';
  delivered: boolean;
  recipient_email?: string;
  acknowledged_at?: string;
  error_message?: string;
}
