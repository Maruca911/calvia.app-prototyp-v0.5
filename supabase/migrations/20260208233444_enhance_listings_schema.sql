/*
  # Enhance listings table with additional fields

  1. Modified Tables
    - `listings`
      - `social_media` (jsonb) - Instagram, Facebook, TikTok URLs
      - `menu_url` (text) - Link to restaurant menu or price list
      - `neighborhood` (text) - Area within Calvia (e.g., Portals Nous, Palmanova)
      - `price_range` (text) - Approximate pricing indicator ($, $$, $$$)
      - `tags` (text[]) - Flexible tags for filtering

  2. Notes
    - All new columns are nullable to maintain backwards compatibility
    - Existing data is not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE listings ADD COLUMN social_media jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'menu_url'
  ) THEN
    ALTER TABLE listings ADD COLUMN menu_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE listings ADD COLUMN neighborhood text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE listings ADD COLUMN price_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'tags'
  ) THEN
    ALTER TABLE listings ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;
