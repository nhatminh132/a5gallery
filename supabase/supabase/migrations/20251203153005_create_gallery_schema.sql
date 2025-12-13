/*
  # Create Gallery Application Schema

  ## Overview
  This migration sets up the complete database schema for the image and video gallery application.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User's email address
  - `full_name` (text, nullable) - User's full name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `media`
  - `id` (uuid, primary key) - Unique media identifier
  - `user_id` (uuid) - References profiles(id)
  - `filename` (text) - Original filename
  - `file_path` (text) - Storage path in Supabase bucket
  - `title` (text) - Media title
  - `description` (text, nullable) - Media description
  - `file_type` (text) - MIME type (image/jpeg, video/mp4, etc.)
  - `file_size` (bigint) - File size in bytes
  - `width` (integer, nullable) - Image/video width
  - `height` (integer, nullable) - Image/video height
  - `duration` (numeric, nullable) - Video duration in seconds
  - `thumbnail_path` (text, nullable) - Thumbnail storage path
  - `upload_date` (timestamptz) - Upload timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  
  ### Row Level Security (RLS)
  - Enable RLS on both tables
  - `profiles`: Users can read all profiles, but only update their own
  - `media`: Users can read all media, but only insert/update/delete their own

  ## 3. Important Notes
  - All timestamps use timezone-aware types
  - Foreign key constraints ensure data integrity
  - Indexes added for performance on common queries
  - Default values set for timestamps
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  width integer,
  height integer,
  duration numeric,
  thumbnail_path text,
  upload_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_upload_date ON media(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Media policies
CREATE POLICY "Users can view all media"
  ON media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON media FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON media FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();