-- Allow anonymous users to view media and profiles
-- This enables public access to the gallery without requiring authentication

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view all media" ON media;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create new policies that allow anonymous read access
CREATE POLICY "Anyone can view media"
  ON media FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Note: Write operations (INSERT, UPDATE, DELETE) still require authentication
-- Only read access is made public