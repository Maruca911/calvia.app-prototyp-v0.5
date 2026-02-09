/*
  # Create reviews, deals, and events tables

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, FK to listings)
      - `user_id` (uuid, FK to auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)
      - Unique constraint: one review per user per listing
    - `deals`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, FK to listings, nullable)
      - `title` (text)
      - `description` (text)
      - `discount_text` (text, e.g. "20% off")
      - `valid_until` (timestamptz)
      - `is_active` (boolean)
      - `image_url` (text)
      - `category` (text)
      - `created_at` (timestamptz)
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `location` (text)
      - `event_date` (timestamptz)
      - `end_date` (timestamptz, nullable)
      - `category` (text)
      - `image_url` (text)
      - `is_featured` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Reviews: anyone can read, authenticated users can create/update/delete own
    - Deals: anyone can read active deals
    - Events: anyone can read events
*/

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_listing_unique ON reviews(user_id, listing_id);
CREATE INDEX IF NOT EXISTS reviews_listing_id_idx ON reviews(listing_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  discount_text text DEFAULT '',
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  image_url text DEFAULT '',
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_active_idx ON deals(is_active) WHERE is_active = true;

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active deals"
  ON deals FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  category text DEFAULT 'General',
  image_url text DEFAULT '',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (event_date >= now() - interval '1 day');
