/*
  # Add calvia.eu-compatible RLS policies and RPC

  This migration is additive and idempotent. Existing calvia.app policies are kept.
*/

-- Enable RLS on compatibility tables
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_bird_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_suggestions ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Calvia EU public read categories" ON categories;
CREATE POLICY "Calvia EU public read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read areas" ON areas;
CREATE POLICY "Calvia EU public read areas"
  ON areas FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read businesses" ON businesses;
CREATE POLICY "Calvia EU public read businesses"
  ON businesses FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read faqs" ON faqs;
CREATE POLICY "Calvia EU public read faqs"
  ON faqs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read published guides" ON guides;
CREATE POLICY "Calvia EU public read published guides"
  ON guides FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Calvia EU public read translations" ON translations;
CREATE POLICY "Calvia EU public read translations"
  ON translations FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read user profiles" ON user_profiles;
CREATE POLICY "Calvia EU public read user profiles"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Calvia EU public read reviews" ON reviews;
CREATE POLICY "Calvia EU public read reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

-- Self-service profile policies
DROP POLICY IF EXISTS "Calvia EU users insert own profile" ON user_profiles;
CREATE POLICY "Calvia EU users insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Calvia EU users update own profile" ON user_profiles;
CREATE POLICY "Calvia EU users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Reviews write policies for authenticated users
DROP POLICY IF EXISTS "Calvia EU users insert own reviews" ON reviews;
CREATE POLICY "Calvia EU users insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (listing_id IS NOT NULL OR business_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Calvia EU users update own reviews" ON reviews;
CREATE POLICY "Calvia EU users update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Calvia EU users delete own reviews" ON reviews;
CREATE POLICY "Calvia EU users delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Optional ownership permissions for claimed business profiles
DROP POLICY IF EXISTS "Calvia EU owners update own businesses" ON businesses;
CREATE POLICY "Calvia EU owners update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Calvia EU owners read own businesses" ON businesses;
CREATE POLICY "Calvia EU owners read own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Public insert form policies with validation + per-email rate limiting
DROP POLICY IF EXISTS "Calvia EU rate-limited early bird signup" ON early_bird_signups;
CREATE POLICY "Calvia EU rate-limited early bird signup"
  ON early_bird_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(email) > 5
    AND email ~ '.+@.+\..+'
    AND length(full_name) > 0
    AND (
      SELECT count(*)
      FROM early_bird_signups ebs
      WHERE ebs.email = early_bird_signups.email
        AND ebs.created_at > now() - interval '1 hour'
    ) < 5
  );

DROP POLICY IF EXISTS "Calvia EU rate-limited contact submission" ON contact_submissions;
CREATE POLICY "Calvia EU rate-limited contact submission"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) > 0
    AND length(email) > 5
    AND email ~ '.+@.+\..+'
    AND length(subject) > 0
    AND length(message) >= 10
    AND (
      SELECT count(*)
      FROM contact_submissions cs
      WHERE cs.email = contact_submissions.email
        AND cs.created_at > now() - interval '1 hour'
    ) < 5
  );

DROP POLICY IF EXISTS "Calvia EU submit business suggestion" ON business_suggestions;
CREATE POLICY "Calvia EU submit business suggestion"
  ON business_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(business_name)) >= 2
    AND length(trim(submitter_name)) >= 2
    AND submitter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

DROP POLICY IF EXISTS "Calvia EU authenticated read own suggestions" ON business_suggestions;
CREATE POLICY "Calvia EU authenticated read own suggestions"
  ON business_suggestions FOR SELECT
  TO authenticated
  USING (submitter_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update view-count RPC for public profile page tracking
DROP FUNCTION IF EXISTS increment_view_count(uuid);

CREATE OR REPLACE FUNCTION increment_view_count(business_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE businesses
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = business_uuid;
END;
$$;

REVOKE ALL ON FUNCTION increment_view_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO anon, authenticated;
