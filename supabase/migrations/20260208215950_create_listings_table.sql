/*
  # Create listings table

  1. New Tables
    - `listings`
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to categories)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `contact_phone` (text)
      - `contact_email` (text)
      - `website_url` (text)
      - `address` (text)
      - `is_featured` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access for all users
*/

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  website_url text DEFAULT '',
  address text DEFAULT '',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are publicly readable"
  ON listings FOR SELECT
  TO authenticated, anon
  USING (id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
