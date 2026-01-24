-- Add device information columns to profiles table
-- This enables tracking of user IP addresses, device names, and operating systems for admin management

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS device_os TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_device_update TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_ip_address ON profiles(ip_address);
CREATE INDEX IF NOT EXISTS idx_profiles_device_os ON profiles(device_os);
CREATE INDEX IF NOT EXISTS idx_profiles_last_device_update ON profiles(last_device_update);

-- Add comments for documentation
COMMENT ON COLUMN profiles.ip_address IS 'User IP address collected during sign-in';
COMMENT ON COLUMN profiles.device_name IS 'Device name/type detected from user agent';
COMMENT ON COLUMN profiles.device_os IS 'Operating system detected from user agent';
COMMENT ON COLUMN profiles.user_agent IS 'Full user agent string for detailed device info';
COMMENT ON COLUMN profiles.last_device_update IS 'Timestamp of last device information update';