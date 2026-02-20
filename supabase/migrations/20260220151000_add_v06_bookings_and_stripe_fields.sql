/*
  # v0.6 bookings + Stripe sync schema

  1. New table
    - `bookings`
      - User-submitted booking requests for partner businesses.

  2. Existing table updates
    - `premium_memberships`
      - Stripe customer/subscription tracking fields.

  3. Security
    - Authenticated users can create/read/update their own bookings.
    - Stripe sync is server-side via service role and bypasses RLS.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  business_name text NOT NULL DEFAULT '',
  service_type text NOT NULL DEFAULT 'restaurant',
  booking_date date,
  booking_time text,
  party_size integer NOT NULL DEFAULT 2,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Users can view own bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings"
      ON bookings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Users can create own bookings'
  ) THEN
    CREATE POLICY "Users can create own bookings"
      ON bookings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Users can update own bookings'
  ) THEN
    CREATE POLICY "Users can update own bookings"
      ON bookings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

ALTER TABLE premium_memberships
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS bookings_user_created_idx
  ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_status_idx
  ON bookings (status);

CREATE INDEX IF NOT EXISTS premium_memberships_customer_idx
  ON premium_memberships (stripe_customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS premium_memberships_subscription_uidx
  ON premium_memberships (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

