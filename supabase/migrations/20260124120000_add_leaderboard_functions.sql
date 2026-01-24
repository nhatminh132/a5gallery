-- Create leaderboard functions for uploads and comments

-- Function to get upload leaderboard
CREATE OR REPLACE FUNCTION get_upload_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  upload_count BIGINT,
  comment_count BIGINT,
  total_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT m.id) AS upload_count,
    0::BIGINT AS comment_count,
    COUNT(DISTINCT m.id) AS total_score
  FROM public.profiles p
  LEFT JOIN public.media m ON m.user_id = p.id
  GROUP BY p.id, p.full_name, p.avatar_url
  HAVING COUNT(DISTINCT m.id) > 0
  ORDER BY upload_count DESC, p.full_name ASC
  LIMIT limit_count;
END;
$$;

-- Function to get comment leaderboard
CREATE OR REPLACE FUNCTION get_comment_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  upload_count BIGINT,
  comment_count BIGINT,
  total_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    0::BIGINT AS upload_count,
    COUNT(DISTINCT c.id) AS comment_count,
    COUNT(DISTINCT c.id) AS total_score
  FROM public.profiles p
  LEFT JOIN public.comments c ON c.user_id = p.id
  GROUP BY p.id, p.full_name, p.avatar_url
  HAVING COUNT(DISTINCT c.id) > 0
  ORDER BY comment_count DESC, p.full_name ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_upload_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_comment_leaderboard TO anon, authenticated;

-- Add comments
COMMENT ON FUNCTION get_upload_leaderboard IS 'Get top users by upload count';
COMMENT ON FUNCTION get_comment_leaderboard IS 'Get top users by comment count';
