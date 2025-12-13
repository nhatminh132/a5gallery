/*
  # Add Super Admin Role System

  ## Overview
  This migration adds a proper role system with Super Admin capabilities.
  
  ## Changes
  1. Add role enum type with USER, ADMIN, SUPER_ADMIN
  2. Add role column to profiles table
  3. Update lpnminh472@gmail.com to Super Admin
  4. Update existing admin users to ADMIN role
  5. Update RLS policies to handle roles properly
  
  ## Roles
  - USER: Regular user with basic permissions
  - ADMIN: Can delete media, moderate content
  - SUPER_ADMIN: Full system access, can manage users and admins
*/

-- Create role enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'USER';

-- Update existing admin users to ADMIN role (preserve existing is_admin = true users)
UPDATE profiles 
SET role = 'ADMIN' 
WHERE is_admin = true;

-- Set lpnminh472@gmail.com as Super Admin
UPDATE profiles 
SET role = 'SUPER_ADMIN', is_admin = true
WHERE email = 'lpnminh472@gmail.com';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update the media deletion policy to include role-based access
DROP POLICY IF EXISTS "Only admins can delete media" ON media;

CREATE POLICY "Admins and Super Admins can delete media"
  ON media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'SUPER_ADMIN')
    )
  );

-- Update profiles update policy for role management
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Super Admins can update any profile (including roles)
CREATE POLICY "Super Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'SUPER_ADMIN'
    )
  );

-- Add function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Add function to check if user has admin privileges
CREATE OR REPLACE FUNCTION has_admin_privileges(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_admin_privileges(uuid) TO authenticated;

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: USER (basic), ADMIN (can moderate), SUPER_ADMIN (full access)';

-- Verify the update
SELECT email, role, is_admin FROM profiles WHERE email = 'lpnminh472@gmail.com';