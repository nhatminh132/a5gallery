-- Add upload limit functionality to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS upload_limit_mb integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS total_uploaded_mb decimal(10,2) DEFAULT 0;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_upload_stats ON profiles(total_uploaded_mb, upload_limit_mb);

-- Create function to calculate user's total upload size (using existing file_size column)
CREATE OR REPLACE FUNCTION calculate_user_upload_size(user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(file_size) FROM media WHERE media.user_id = calculate_user_upload_size.user_id),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update user's total upload size
CREATE OR REPLACE FUNCTION update_user_upload_total()
RETURNS trigger AS $$
BEGIN
  -- Update the user's total uploaded size
  UPDATE profiles 
  SET total_uploaded_mb = ROUND(calculate_user_upload_size(NEW.user_id) / 1048576.0) -- Convert bytes to MB
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update upload totals
DROP TRIGGER IF EXISTS trigger_update_upload_total ON media;
CREATE TRIGGER trigger_update_upload_total
  AFTER INSERT OR DELETE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_user_upload_total();

-- Update existing users with calculated totals
UPDATE profiles 
SET total_uploaded_mb = ROUND(calculate_user_upload_size(id) / 1048576.0);

-- Set lpnminh472@gmail.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'lpnminh472@gmail.com';

-- Create function to check upload limit
CREATE OR REPLACE FUNCTION check_upload_limit(
  user_id uuid,
  file_size_bytes bigint
) RETURNS boolean AS $$
DECLARE
  user_is_admin boolean;
  user_limit_mb integer;
  current_total_mb decimal(10,2);
  new_total_mb decimal(10,2);
BEGIN
  -- Get user info
  SELECT is_admin, upload_limit_mb, total_uploaded_mb
  INTO user_is_admin, user_limit_mb, current_total_mb
  FROM profiles 
  WHERE id = user_id;
  
  -- Admin has unlimited uploads
  IF user_is_admin THEN
    RETURN true;
  END IF;
  
  -- Calculate new total if this file is uploaded
  new_total_mb := current_total_mb + ROUND(file_size_bytes / 1048576.0, 2);
  
  -- Check if within limit
  RETURN new_total_mb <= user_limit_mb;
END;
$$ LANGUAGE plpgsql;