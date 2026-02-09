/*
  # Create store visits table for QR code check-in system

  1. New Tables
    - `store_visits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `listing_id` (uuid, references listings, nullable for general visits)
      - `points_earned` (integer, default 10)
      - `verified_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Schema Changes
    - Add `qr_token` column to `profiles` for unique QR code identifier
    - Update handle_new_user() to generate qr_token on signup

  3. Security
    - Enable RLS on `store_visits`
    - Users can view their own visit history
    - Inserts only via authenticated sessions with matching user_id

  4. Important Notes
    - Each store visit awards points (default 10)
    - QR tokens are unique per user for business scanning
    - Points accumulate toward tier upgrades (Silver/Gold/Platinum)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'qr_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN qr_token text UNIQUE;
  END IF;
END $$;

UPDATE profiles
SET qr_token = 'QR-' || UPPER(SUBSTRING(MD5(id::text || 'calvia-qr') FROM 1 FOR 12))
WHERE qr_token IS NULL;

CREATE TABLE IF NOT EXISTS store_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  points_earned integer DEFAULT 10,
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visit history"
  ON store_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON store_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, referral_code, qr_token)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'CALVIA-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    'QR-' || UPPER(SUBSTRING(MD5(NEW.id::text || 'calvia-qr') FROM 1 FOR 12))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();