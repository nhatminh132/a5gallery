-- Enforce a maximum of 5 tags per media item

CREATE OR REPLACE FUNCTION enforce_max_five_tags()
RETURNS TRIGGER AS $$
DECLARE
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count FROM media_tags WHERE media_id = NEW.media_id;
  IF TG_OP = 'INSERT' THEN
    IF tag_count >= 5 THEN
      RAISE EXCEPTION 'A media item can have at most 5 tags';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_five_tags_trigger ON media_tags;
CREATE TRIGGER enforce_max_five_tags_trigger
  BEFORE INSERT ON media_tags
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_five_tags();
