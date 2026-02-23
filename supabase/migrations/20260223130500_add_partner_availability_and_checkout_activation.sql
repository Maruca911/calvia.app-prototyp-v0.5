/*
  # Partner availability baseline + Stripe membership self-sync

  1. New tables
    - `partner_availability_settings`
      - Stores partner-level booking availability rules.
    - `partner_calendar_connections`
      - Stores connected calendar providers for partners.

  2. Security
    - Authenticated users can read/write their own availability settings.
    - Authenticated users can read/write their own calendar connections.

  3. New RPC
    - `upsert_own_membership_from_checkout(...)`
      - Allows authenticated user-scoped membership sync after checkout success.
      - Keeps `profiles.is_premium` in sync without requiring service-role writes.
*/

CREATE TABLE IF NOT EXISTS partner_availability_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  min_lead_minutes integer NOT NULL DEFAULT 120,
  max_advance_days integer NOT NULL DEFAULT 90,
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  slot_capacity integer NOT NULL DEFAULT 4,
  allow_waitlist boolean NOT NULL DEFAULT true,
  blackout_dates date[] NOT NULL DEFAULT '{}',
  weekly_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_availability_settings_partner_user_id_key UNIQUE (partner_user_id),
  CONSTRAINT partner_availability_settings_min_lead_chk CHECK (min_lead_minutes >= 0),
  CONSTRAINT partner_availability_settings_max_advance_chk CHECK (max_advance_days >= 1),
  CONSTRAINT partner_availability_settings_slot_interval_chk CHECK (slot_interval_minutes >= 5),
  CONSTRAINT partner_availability_settings_slot_capacity_chk CHECK (slot_capacity >= 1)
);

ALTER TABLE partner_availability_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_availability_settings'
      AND policyname = 'Partners can view own availability settings'
  ) THEN
    CREATE POLICY "Partners can view own availability settings"
      ON partner_availability_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = partner_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_availability_settings'
      AND policyname = 'Partners can insert own availability settings'
  ) THEN
    CREATE POLICY "Partners can insert own availability settings"
      ON partner_availability_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = partner_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_availability_settings'
      AND policyname = 'Partners can update own availability settings'
  ) THEN
    CREATE POLICY "Partners can update own availability settings"
      ON partner_availability_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = partner_user_id)
      WITH CHECK (auth.uid() = partner_user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS partner_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  account_email text NOT NULL DEFAULT '',
  external_calendar_id text NOT NULL DEFAULT '',
  sync_direction text NOT NULL DEFAULT 'two_way',
  status text NOT NULL DEFAULT 'connected',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_calendar_connections_provider_chk CHECK (provider IN ('google', 'outlook', 'apple')),
  CONSTRAINT partner_calendar_connections_sync_direction_chk CHECK (sync_direction IN ('import_only', 'export_only', 'two_way')),
  CONSTRAINT partner_calendar_connections_status_chk CHECK (status IN ('connected', 'syncing', 'error', 'disconnected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_calendar_connections_unique_idx
  ON partner_calendar_connections (partner_user_id, provider, external_calendar_id);

CREATE INDEX IF NOT EXISTS partner_calendar_connections_user_idx
  ON partner_calendar_connections (partner_user_id, created_at DESC);

ALTER TABLE partner_calendar_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_calendar_connections'
      AND policyname = 'Partners can view own calendar connections'
  ) THEN
    CREATE POLICY "Partners can view own calendar connections"
      ON partner_calendar_connections
      FOR SELECT
      TO authenticated
      USING (auth.uid() = partner_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_calendar_connections'
      AND policyname = 'Partners can insert own calendar connections'
  ) THEN
    CREATE POLICY "Partners can insert own calendar connections"
      ON partner_calendar_connections
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = partner_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_calendar_connections'
      AND policyname = 'Partners can update own calendar connections'
  ) THEN
    CREATE POLICY "Partners can update own calendar connections"
      ON partner_calendar_connections
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = partner_user_id)
      WITH CHECK (auth.uid() = partner_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_calendar_connections'
      AND policyname = 'Partners can delete own calendar connections'
  ) THEN
    CREATE POLICY "Partners can delete own calendar connections"
      ON partner_calendar_connections
      FOR DELETE
      TO authenticated
      USING (auth.uid() = partner_user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_partner_module_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_partner_availability_settings_updated_at
  ON partner_availability_settings;

CREATE TRIGGER set_partner_availability_settings_updated_at
  BEFORE UPDATE ON partner_availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_module_updated_at();

DROP TRIGGER IF EXISTS set_partner_calendar_connections_updated_at
  ON partner_calendar_connections;

CREATE TRIGGER set_partner_calendar_connections_updated_at
  BEFORE UPDATE ON partner_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_module_updated_at();

CREATE OR REPLACE FUNCTION upsert_own_membership_from_checkout(
  p_plan_type text,
  p_status text,
  p_started_at timestamptz,
  p_expires_at timestamptz,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_canceled_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid := auth.uid();
  existing_membership_id uuid;
  normalized_plan text;
  normalized_status text;
  premium_active boolean;
BEGIN
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  normalized_plan := CASE
    WHEN lower(coalesce(p_plan_type, '')) = 'annual' THEN 'annual'
    ELSE 'monthly'
  END;

  normalized_status := CASE
    WHEN lower(coalesce(p_status, '')) IN ('active', 'trialing', 'past_due') THEN 'active'
    WHEN lower(coalesce(p_status, '')) IN ('cancelled', 'canceled') THEN 'cancelled'
    ELSE 'expired'
  END;

  premium_active := normalized_status = 'active';

  SELECT id
    INTO existing_membership_id
    FROM premium_memberships
   WHERE user_id = target_user
   ORDER BY created_at DESC
   LIMIT 1;

  IF existing_membership_id IS NULL THEN
    INSERT INTO premium_memberships (
      user_id,
      plan_type,
      status,
      started_at,
      expires_at,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      current_period_start,
      current_period_end,
      canceled_at,
      updated_at
    )
    VALUES (
      target_user,
      normalized_plan,
      normalized_status,
      COALESCE(p_started_at, now()),
      COALESCE(p_expires_at, p_current_period_end),
      p_stripe_customer_id,
      p_stripe_subscription_id,
      p_stripe_price_id,
      p_current_period_start,
      p_current_period_end,
      p_canceled_at,
      now()
    );
  ELSE
    UPDATE premium_memberships
       SET plan_type = normalized_plan,
           status = normalized_status,
           started_at = COALESCE(p_started_at, started_at, now()),
           expires_at = COALESCE(p_expires_at, p_current_period_end, expires_at),
           stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
           stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
           stripe_price_id = COALESCE(p_stripe_price_id, stripe_price_id),
           current_period_start = COALESCE(p_current_period_start, current_period_start),
           current_period_end = COALESCE(p_current_period_end, current_period_end),
           canceled_at = COALESCE(p_canceled_at, canceled_at),
           updated_at = now()
     WHERE id = existing_membership_id;
  END IF;

  UPDATE profiles
     SET is_premium = premium_active
   WHERE id = target_user;
END;
$$;

REVOKE ALL ON FUNCTION upsert_own_membership_from_checkout(
  text,
  text,
  timestamptz,
  timestamptz,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION upsert_own_membership_from_checkout(
  text,
  text,
  timestamptz,
  timestamptz,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz
) TO authenticated;
