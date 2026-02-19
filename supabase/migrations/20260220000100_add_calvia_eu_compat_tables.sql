/*
  # Add calvia.eu compatibility tables and columns

  This migration is additive and idempotent. It prepares the existing calvia.app
  schema to host calvia.eu-compatible content in the same Supabase project.
*/

-- Ensure categories can be ordered by calvia.eu query contract
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

UPDATE categories
SET display_order = COALESCE(NULLIF(display_order, 0), sort_order, 0)
WHERE display_order IS NULL OR display_order = 0;

-- Areas table used by calvia.eu
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  highlights text[] DEFAULT '{}',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Businesses table used by calvia.eu
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES categories(id),
  area_id uuid NOT NULL REFERENCES areas(id),
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  is_placeholder boolean DEFAULT true,
  rating numeric,
  notes text,
  social_links jsonb DEFAULT '{}'::jsonb,
  image_url text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES auth.users(id),
  claimed boolean DEFAULT false,
  view_count integer DEFAULT 0,
  location_confidence text NOT NULL DEFAULT 'approximate'
    CHECK (location_confidence IN ('exact', 'approximate', 'area')),
  needs_geocoding boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist even if businesses was created by a prior partial run
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS rating numeric;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_confidence text DEFAULT 'approximate';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS needs_geocoding boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_location_confidence_check'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_location_confidence_check
      CHECK (location_confidence IN ('exact', 'approximate', 'area'));
  END IF;
END $$;

-- Guides / FAQs / translations
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL DEFAULT 'category',
  page_slug text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  area_slug text,
  category_slug text,
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  locale text NOT NULL,
  field text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- calvia.eu auth/profile support
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- calvia.eu public form tables
CREATE TABLE IF NOT EXISTS early_bird_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_type text NOT NULL CHECK (signup_type IN ('consumer', 'business')),
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  property_type text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  business_category text NOT NULL DEFAULT '',
  business_size text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS subject text DEFAULT '';

CREATE TABLE IF NOT EXISTS business_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Deterministic bridge between calvia.eu businesses and calvia.app listings
CREATE TABLE IF NOT EXISTS business_listing_map (
  business_id uuid PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  listing_id uuid UNIQUE NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_business_listing_map_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_business_listing_map_updated_at ON business_listing_map;
CREATE TRIGGER trg_touch_business_listing_map_updated_at
  BEFORE UPDATE ON business_listing_map
  FOR EACH ROW
  EXECUTE FUNCTION touch_business_listing_map_updated_at();

-- Reviews compatibility columns for both apps
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE reviews
SET content = COALESCE(NULLIF(content, ''), comment, '')
WHERE content IS NULL OR content = '';

UPDATE reviews
SET title = COALESCE(title, '')
WHERE title IS NULL;

UPDATE reviews
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE reviews
  ALTER COLUMN content SET DEFAULT '';

ALTER TABLE reviews
  ALTER COLUMN content SET NOT NULL;

-- Indexes for calvia.eu query paths
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_area ON businesses(area_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_name_fts ON businesses USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_faqs_page ON faqs(page_type, page_slug);
CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_area ON guides(area_slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_unique
  ON translations(entity_type, entity_id, locale, field);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_business_user_unique
  ON reviews(business_id, user_id)
  WHERE business_id IS NOT NULL;
