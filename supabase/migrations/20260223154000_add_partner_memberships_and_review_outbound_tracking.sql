/*
  # Partner memberships + booking visibility + outbound review tracking

  1. New tables
    - business_memberships
      Role-based membership rows for per-business partner dashboard access.
    - review_outbound_events
      Tracks outbound clicks to external review destinations.

  2. RLS/policies
    - Users can read their own membership rows.
    - Business owners can manage memberships for businesses they own.
    - Partners can read/update bookings mapped to their business via business_listing_map.
    - Anyone can insert outbound review click events (with optional authenticated user_id).
*/

CREATE TABLE IF NOT EXISTS business_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_memberships_business_user_key UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS business_memberships_user_idx
  ON business_memberships (user_id, status);

CREATE INDEX IF NOT EXISTS business_memberships_business_idx
  ON business_memberships (business_id, status);

ALTER TABLE business_memberships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_memberships'
      AND policyname = 'Users can view own business memberships'
  ) THEN
    CREATE POLICY "Users can view own business memberships"
      ON business_memberships
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
      AND tablename = 'business_memberships'
      AND policyname = 'Business owners can manage memberships'
  ) THEN
    CREATE POLICY "Business owners can manage memberships"
      ON business_memberships
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM businesses b
          WHERE b.id = business_memberships.business_id
            AND b.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM businesses b
          WHERE b.id = business_memberships.business_id
            AND b.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_business_memberships_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_business_memberships_updated_at ON business_memberships;

CREATE TRIGGER set_business_memberships_updated_at
  BEFORE UPDATE ON business_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_business_memberships_updated_at();

CREATE TABLE IF NOT EXISTS review_outbound_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'tripadvisor')),
  destination_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_outbound_events_listing_idx
  ON review_outbound_events (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS review_outbound_events_provider_idx
  ON review_outbound_events (provider, created_at DESC);

ALTER TABLE review_outbound_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_outbound_events'
      AND policyname = 'Anyone can insert review outbound events'
  ) THEN
    CREATE POLICY "Anyone can insert review outbound events"
      ON review_outbound_events
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_outbound_events'
      AND policyname = 'Users can read own review outbound events'
  ) THEN
    CREATE POLICY "Users can read own review outbound events"
      ON review_outbound_events
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bookings_listing_id_idx
  ON bookings (listing_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'bookings'
        AND policyname = 'Business members can view mapped bookings'
    ) THEN
      CREATE POLICY "Business members can view mapped bookings"
        ON bookings
        FOR SELECT
        TO authenticated
        USING (
          listing_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM business_listing_map blm
            JOIN businesses b
              ON b.id = blm.business_id
            LEFT JOIN business_memberships bm
              ON bm.business_id = b.id
             AND bm.user_id = auth.uid()
             AND bm.status = 'active'
            WHERE blm.listing_id = bookings.listing_id
              AND (b.owner_id = auth.uid() OR bm.id IS NOT NULL)
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'bookings'
        AND policyname = 'Business members can update mapped bookings'
    ) THEN
      CREATE POLICY "Business members can update mapped bookings"
        ON bookings
        FOR UPDATE
        TO authenticated
        USING (
          listing_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM business_listing_map blm
            JOIN businesses b
              ON b.id = blm.business_id
            LEFT JOIN business_memberships bm
              ON bm.business_id = b.id
             AND bm.user_id = auth.uid()
             AND bm.status = 'active'
            WHERE blm.listing_id = bookings.listing_id
              AND (b.owner_id = auth.uid() OR bm.id IS NOT NULL)
          )
        )
        WITH CHECK (
          listing_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM business_listing_map blm
            JOIN businesses b
              ON b.id = blm.business_id
            LEFT JOIN business_memberships bm
              ON bm.business_id = b.id
             AND bm.user_id = auth.uid()
             AND bm.status = 'active'
            WHERE blm.listing_id = bookings.listing_id
              AND (b.owner_id = auth.uid() OR bm.id IS NOT NULL)
          )
        );
    END IF;
  END IF;
END $$;
