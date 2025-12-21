-- Allow admins to manage tags on any media (insert/delete in media_tags)

CREATE POLICY "Admins can tag any media"
  ON media_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.email = 'lpnminh472@gmail.com')
    )
  );

CREATE POLICY "Admins can remove tags from any media"
  ON media_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.email = 'lpnminh472@gmail.com')
    )
  );