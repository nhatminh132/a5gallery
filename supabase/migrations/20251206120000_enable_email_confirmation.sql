-- Enable email confirmation for sign up
-- This migration ensures that users must verify their email address before they can sign in

-- Update auth settings to require email confirmation
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_email_confirmations = true,
  enable_email_autoconfirm = false
WHERE true;

-- Add email verification status to profiles (optional, for tracking)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Function to update email_verified_at when user confirms email
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS trigger AS $$
BEGIN
  -- Update the profile when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles 
    SET email_verified_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update email verification status
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_verification();

-- Add RLS policy for email_verified_at
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own verification status
CREATE POLICY "Users can view their own email verification status" 
ON profiles FOR SELECT 
USING (auth.uid() = id);