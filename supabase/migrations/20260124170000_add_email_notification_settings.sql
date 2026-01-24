-- Add email notification preferences for users

-- Create notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_comment BOOLEAN DEFAULT true,
  email_on_like BOOLEAN DEFAULT true,
  email_on_mention BOOLEAN DEFAULT true,
  email_on_follow BOOLEAN DEFAULT false,
  email_on_album_invite BOOLEAN DEFAULT true,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'none', 'daily', 'weekly'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to initialize notification settings for new users
CREATE OR REPLACE FUNCTION initialize_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create settings when profile is created
CREATE TRIGGER create_notification_settings_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_settings();

-- Function to get user notification settings
CREATE OR REPLACE FUNCTION get_notification_settings(user_uuid UUID)
RETURNS TABLE (
  email_on_comment BOOLEAN,
  email_on_like BOOLEAN,
  email_on_mention BOOLEAN,
  email_on_follow BOOLEAN,
  email_on_album_invite BOOLEAN,
  email_digest_frequency VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.email_on_comment,
    ns.email_on_like,
    ns.email_on_mention,
    ns.email_on_follow,
    ns.email_on_album_invite,
    ns.email_digest_frequency
  FROM public.notification_settings ns
  WHERE ns.user_id = user_uuid;
END;
$$;

-- Function to update notification settings
CREATE OR REPLACE FUNCTION update_notification_settings(
  user_uuid UUID,
  new_email_on_comment BOOLEAN DEFAULT NULL,
  new_email_on_like BOOLEAN DEFAULT NULL,
  new_email_on_mention BOOLEAN DEFAULT NULL,
  new_email_on_follow BOOLEAN DEFAULT NULL,
  new_email_on_album_invite BOOLEAN DEFAULT NULL,
  new_email_digest_frequency VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notification_settings
  SET 
    email_on_comment = COALESCE(new_email_on_comment, email_on_comment),
    email_on_like = COALESCE(new_email_on_like, email_on_like),
    email_on_mention = COALESCE(new_email_on_mention, email_on_mention),
    email_on_follow = COALESCE(new_email_on_follow, email_on_follow),
    email_on_album_invite = COALESCE(new_email_on_album_invite, email_on_album_invite),
    email_digest_frequency = COALESCE(new_email_digest_frequency, email_digest_frequency),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- If no row exists, create it
  IF NOT FOUND THEN
    INSERT INTO public.notification_settings (
      user_id,
      email_on_comment,
      email_on_like,
      email_on_mention,
      email_on_follow,
      email_on_album_invite,
      email_digest_frequency
    ) VALUES (
      user_uuid,
      COALESCE(new_email_on_comment, true),
      COALESCE(new_email_on_like, true),
      COALESCE(new_email_on_mention, true),
      COALESCE(new_email_on_follow, false),
      COALESCE(new_email_on_album_invite, true),
      COALESCE(new_email_digest_frequency, 'daily')
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_settings TO authenticated;

-- Add comments
COMMENT ON TABLE public.notification_settings IS 'Email notification preferences for users';
COMMENT ON COLUMN public.notification_settings.email_digest_frequency IS 'How often to send digest emails: none, daily, or weekly';
