-- Fix admin upload limits functionality
-- Allow admins to update upload limits for all users

-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate the policy to allow both:
-- 1. Users to update their own profile
-- 2. Admins to update any profile (specifically for upload limits)
CREATE POLICY "Users can update own profile or admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  );

-- Alternative: Create a separate policy specifically for admin updates
-- This is cleaner and more explicit
DROP POLICY IF EXISTS "Users can update own profile or admins can update any profile" ON profiles;

-- Recreate the original user policy
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add new admin policy
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  );