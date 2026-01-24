-- Add bio and additional profile fields for user profiles
-- User profiles accessible at /user/<user_id>

-- Add bio column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS twitter VARCHAR(100),
ADD COLUMN IF NOT EXISTS github VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description for profile page';
COMMENT ON COLUMN public.profiles.website IS 'User website URL';
COMMENT ON COLUMN public.profiles.location IS 'User location';
COMMENT ON COLUMN public.profiles.twitter IS 'Twitter username';
COMMENT ON COLUMN public.profiles.github IS 'GitHub username';

-- Update RLS policies to allow public viewing of profile data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles viewable by all"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
