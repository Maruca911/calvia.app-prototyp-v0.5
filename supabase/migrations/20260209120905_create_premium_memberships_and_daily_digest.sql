/*
  # Create Premium Memberships and Daily Digest System

  1. New Tables
    - `premium_memberships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users) - the premium subscriber
      - `plan_type` (text) - 'monthly' or 'annual'
      - `status` (text) - 'active', 'cancelled', 'expired'
      - `started_at` (timestamptz) - subscription start date
      - `expires_at` (timestamptz) - subscription expiry
      - `created_at` (timestamptz)
    - `daily_digests`
      - `id` (uuid, primary key)
      - `digest_date` (date, unique) - one digest per day
      - `weather_summary` (text) - weather description for Calvia
      - `weather_temp_high` (integer) - high temperature
      - `weather_temp_low` (integer) - low temperature
      - `weather_icon` (text) - weather condition icon name
      - `news_items` (jsonb) - array of local news headlines
      - `featured_events` (jsonb) - array of this week's events
      - `premium_deals` (jsonb) - array of premium-only deal summaries
      - `created_at` (timestamptz)

  2. Modified Tables
    - `profiles`
      - `is_premium` (boolean) - quick check for premium status

  3. Security
    - RLS on `premium_memberships`: users can read their own membership
    - RLS on `daily_digests`: only premium users can read digests
    - INSERT on both tables restricted (admin/server-side only)

  4. Notes
    - Premium membership is currently placeholder (no Stripe integration)
    - Daily digest will be populated by edge function or manual seeding
    - is_premium on profiles allows fast client-side checks
*/

CREATE TABLE IF NOT EXISTS premium_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text DEFAULT 'monthly',
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE premium_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
  ON premium_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS daily_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date date UNIQUE NOT NULL,
  weather_summary text DEFAULT '',
  weather_temp_high integer DEFAULT 0,
  weather_temp_low integer DEFAULT 0,
  weather_icon text DEFAULT 'sun',
  news_items jsonb DEFAULT '[]',
  featured_events jsonb DEFAULT '[]',
  premium_deals jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premium users can read daily digests"
  ON daily_digests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM premium_memberships
      WHERE premium_memberships.user_id = auth.uid()
      AND premium_memberships.status = 'active'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS premium_memberships_user_idx
  ON premium_memberships(user_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS daily_digests_date_idx
  ON daily_digests(digest_date);
