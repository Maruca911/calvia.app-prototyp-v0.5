/*
  # Create concierge_requests table

  1. New Tables
    - `concierge_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references auth.users)
      - `session_id` (text, for guest users)
      - `request_type` (text) - restaurant_booking, taxi_transfer, report_issue, custom_request, recommendation
      - `details` (jsonb) - flexible schema per request type
      - `status` (text) - pending, acknowledged, completed, cancelled
      - `reference_number` (text, unique) - human-readable reference
      - `admin_notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `concierge_requests` table
    - Authenticated users can insert their own requests
    - Authenticated users can view their own requests
    - Guest requests tracked by session_id (insert only, no read-back)

  3. Notes
    - reference_number generated via trigger for human-friendly IDs
    - updated_at auto-updates via trigger
*/

CREATE TABLE IF NOT EXISTS concierge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  request_type text NOT NULL DEFAULT 'custom_request',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  reference_number text UNIQUE,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION generate_concierge_reference()
RETURNS trigger AS $$
DECLARE
  prefix text;
  seq_num int;
BEGIN
  CASE NEW.request_type
    WHEN 'restaurant_booking' THEN prefix := 'RES';
    WHEN 'taxi_transfer' THEN prefix := 'TXI';
    WHEN 'report_issue' THEN prefix := 'RPT';
    WHEN 'recommendation' THEN prefix := 'REC';
    ELSE prefix := 'REQ';
  END CASE;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference_number FROM '[0-9]+$') AS int)
  ), 0) + 1
  INTO seq_num
  FROM concierge_requests
  WHERE reference_number LIKE prefix || '-%';

  NEW.reference_number := prefix || '-' || LPAD(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_concierge_reference ON concierge_requests;

CREATE TRIGGER set_concierge_reference
  BEFORE INSERT ON concierge_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_concierge_reference();

CREATE OR REPLACE FUNCTION update_concierge_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_concierge_updated_at ON concierge_requests;

CREATE TRIGGER set_concierge_updated_at
  BEFORE UPDATE ON concierge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_updated_at();

ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own requests"
  ON concierge_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own requests"
  ON concierge_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Guest users can insert requests"
  ON concierge_requests
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);
