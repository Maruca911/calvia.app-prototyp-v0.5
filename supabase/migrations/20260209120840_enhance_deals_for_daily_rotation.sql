/*
  # Enhance Deals Table for Daily Rotation

  1. Modified Tables
    - `deals`
      - `deal_date` (date) - specific date this deal is featured as "Deal of the Day"
      - `is_premium_only` (boolean) - whether deal is exclusive to premium members
      - `listing_id` - link existing deals to real listings

  2. Indexes
    - `deals_date_idx` on `deal_date` for fast daily lookups

  3. Notes
    - deal_date allows assigning deals to specific days
    - When deal_date is NULL, deal appears in general deals list
    - Daily rotation picks deals matching today's date, or falls back to random active deals
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'deal_date'
  ) THEN
    ALTER TABLE deals ADD COLUMN deal_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'is_premium_only'
  ) THEN
    ALTER TABLE deals ADD COLUMN is_premium_only boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS deals_deal_date_idx ON deals(deal_date) WHERE deal_date IS NOT NULL;
