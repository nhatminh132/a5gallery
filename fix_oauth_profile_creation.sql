-- Fix for Spotify OAuth "Database error saving new user" issue
-- Run this in Supabase SQL Editor to fix profile creation during OAuth

-- Update the handle_new_user function to handle all columns properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    is_admin,
    upload_limit_mb,
    total_uploaded_mb
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false,  -- Default not admin
    500,    -- Default 500MB limit
    0       -- Start with 0 uploaded
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created successfully
SELECT 'OAuth profile creation fix applied successfully!' as status;