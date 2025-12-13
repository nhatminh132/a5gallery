import { createClient } from '@supabase/supabase-js';

// Primary (storage1) project hosts Auth and Database (profiles, media metadata)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_1 || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_1 || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  bio?: string | null;
  avatar_url: string | null;
  avatar_id?: string | null;
  avatar_upload_date?: string | null;
  avatar_file_size?: number | null;
  avatar_file_type?: string | null;
  upload_limit_mb: number;
  total_uploaded_mb: number;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  role?: UserRole;
  ip_address?: string;
  device_name?: string;
  device_os?: string;
  user_agent?: string;
  last_device_update?: string;
}

export interface Media {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  title: string;
  description: string | null;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnail_path: string | null;
  storage_provider: 'storage1' | 'storage2' | 'storage3' | 'storage4';
  upload_date: string;
  created_at: string;
  is_verified?: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
    is_admin?: boolean;
  };
  url?: string; // Computed property for media URL
  thumbnailUrl?: string | null; // Computed property for thumbnail URL
}
