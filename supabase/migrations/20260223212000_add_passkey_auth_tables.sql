/*
  # Passkey authentication support tables

  Adds additive, idempotent schema for WebAuthn passkey login:
  - passkey_credentials: stores verified credential metadata per user.
  - passkey_challenges: stores short-lived challenge records for registration/authentication.
*/

CREATE TABLE IF NOT EXISTS passkey_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  credential_id text NOT NULL,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_type text,
  backed_up boolean NOT NULL DEFAULT false,
  friendly_name text NOT NULL DEFAULT 'Calvia Passkey',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS passkey_credentials_credential_id_idx
  ON passkey_credentials (credential_id);

CREATE INDEX IF NOT EXISTS passkey_credentials_user_id_idx
  ON passkey_credentials (user_id);

CREATE INDEX IF NOT EXISTS passkey_credentials_email_idx
  ON passkey_credentials (lower(email));

CREATE OR REPLACE FUNCTION update_passkey_credentials_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_passkey_credentials_updated_at ON passkey_credentials;

CREATE TRIGGER set_passkey_credentials_updated_at
  BEFORE UPDATE ON passkey_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_passkey_credentials_updated_at();

ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'passkey_credentials'
      AND policyname = 'Users can read own passkeys'
  ) THEN
    CREATE POLICY "Users can read own passkeys"
      ON passkey_credentials
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
      AND tablename = 'passkey_credentials'
      AND policyname = 'Users can insert own passkeys'
  ) THEN
    CREATE POLICY "Users can insert own passkeys"
      ON passkey_credentials
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
      AND tablename = 'passkey_credentials'
      AND policyname = 'Users can delete own passkeys'
  ) THEN
    CREATE POLICY "Users can delete own passkeys"
      ON passkey_credentials
      FOR DELETE
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
      AND tablename = 'passkey_credentials'
      AND policyname = 'Users can update own passkeys'
  ) THEN
    CREATE POLICY "Users can update own passkeys"
      ON passkey_credentials
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS passkey_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow text NOT NULL CHECK (flow IN ('registration', 'authentication')),
  challenge text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS passkey_challenges_lookup_idx
  ON passkey_challenges (flow, id, expires_at);

CREATE INDEX IF NOT EXISTS passkey_challenges_email_idx
  ON passkey_challenges (lower(email));

ALTER TABLE passkey_challenges ENABLE ROW LEVEL SECURITY;
