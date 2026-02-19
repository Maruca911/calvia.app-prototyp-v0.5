/*
  # Add compatibility triggers for shared reviews and listing mapping

  Keeps calvia.app (`listing_id` + `comment`) and calvia.eu
  (`business_id` + `content/title`) review flows in sync.
*/

-- Keep category display ordering aligned for top-level rows when missing.
UPDATE categories
SET display_order = COALESCE(NULLIF(display_order, 0), sort_order, 0)
WHERE display_order IS NULL OR display_order = 0;

-- Keep app/eu review shapes synchronized on write
CREATE OR REPLACE FUNCTION sync_shared_reviews_shape()
RETURNS trigger AS $$
BEGIN
  -- Keep textual payload compatible between both apps
  IF (NEW.content IS NULL OR NEW.content = '') AND NEW.comment IS NOT NULL THEN
    NEW.content := NEW.comment;
  END IF;

  IF (NEW.comment IS NULL OR NEW.comment = '') AND NEW.content IS NOT NULL THEN
    NEW.comment := NEW.content;
  END IF;

  NEW.title := COALESCE(NEW.title, '');
  NEW.content := COALESCE(NEW.content, '');
  NEW.comment := COALESCE(NEW.comment, NEW.content, '');
  NEW.updated_at := now();

  -- Resolve bridge ids when only one side is provided
  IF NEW.business_id IS NULL AND NEW.listing_id IS NOT NULL THEN
    SELECT blm.business_id
    INTO NEW.business_id
    FROM business_listing_map blm
    WHERE blm.listing_id = NEW.listing_id
    LIMIT 1;
  END IF;

  IF NEW.listing_id IS NULL AND NEW.business_id IS NOT NULL THEN
    SELECT blm.listing_id
    INTO NEW.listing_id
    FROM business_listing_map blm
    WHERE blm.business_id = NEW.business_id
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_shared_reviews_shape ON reviews;
CREATE TRIGGER trg_sync_shared_reviews_shape
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_shared_reviews_shape();

-- When a business<->listing mapping is created later, backfill any partial reviews.
CREATE OR REPLACE FUNCTION backfill_reviews_from_mapping()
RETURNS trigger AS $$
BEGIN
  UPDATE reviews
  SET business_id = NEW.business_id
  WHERE listing_id = NEW.listing_id
    AND business_id IS NULL;

  UPDATE reviews
  SET listing_id = NEW.listing_id
  WHERE business_id = NEW.business_id
    AND listing_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_backfill_reviews_from_mapping ON business_listing_map;
CREATE TRIGGER trg_backfill_reviews_from_mapping
  AFTER INSERT OR UPDATE ON business_listing_map
  FOR EACH ROW
  EXECUTE FUNCTION backfill_reviews_from_mapping();
