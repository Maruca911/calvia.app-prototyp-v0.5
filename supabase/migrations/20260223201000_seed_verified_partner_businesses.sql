/*
  # Seed verified partner businesses for v0.6 staging

  Adds minimal records for the current verified partners:
  - The Agency (Luxury Real Estate Agency)
  - Rib Club (Boating Club)
  - Just Curry (Restaurant in Portals Nous)

  This migration is additive and idempotent.
*/

INSERT INTO areas (id, name, slug, description, latitude, longitude, highlights, image_url)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'Portals Nous',
    'portals-nous',
    'Upscale coastal area known for Puerto Portals marina, international dining, and luxury services.',
    39.5358,
    2.5706,
    ARRAY['Puerto Portals', 'Seafront dining', 'Premium services']::text[],
    ''
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'Puerto Portals',
    'puerto-portals',
    'Luxury marina hub with yachting, premium restaurants, and concierge lifestyle services.',
    39.5372,
    2.5753,
    ARRAY['Luxury marina', 'Yachting', 'Lifestyle destination']::text[],
    ''
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'Santa Ponsa',
    'santa-ponsa',
    'Popular bay in southwest Mallorca with beaches, boating, and year-round resident life.',
    39.5082,
    2.4768,
    ARRAY['Beachfront', 'Boating', 'Family area']::text[],
    ''
  )
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  highlights = EXCLUDED.highlights;

DO $$
DECLARE
  agencies_category_id uuid;
  water_sports_category_id uuid;
  dining_category_id uuid;
  portals_nous_area_id uuid;
  puerto_portals_area_id uuid;
  santa_ponsa_area_id uuid;
BEGIN
  SELECT id INTO agencies_category_id FROM categories WHERE slug = 'agencies' LIMIT 1;
  IF agencies_category_id IS NULL THEN
    SELECT id INTO agencies_category_id FROM categories WHERE slug = 'real-estate' LIMIT 1;
  END IF;

  SELECT id INTO water_sports_category_id FROM categories WHERE slug = 'water-sports' LIMIT 1;
  IF water_sports_category_id IS NULL THEN
    SELECT id INTO water_sports_category_id FROM categories WHERE slug = 'activities' LIMIT 1;
  END IF;

  SELECT id INTO dining_category_id FROM categories WHERE slug = 'international-cuisine' LIMIT 1;
  IF dining_category_id IS NULL THEN
    SELECT id INTO dining_category_id FROM categories WHERE slug = 'dining' LIMIT 1;
  END IF;

  SELECT id INTO portals_nous_area_id FROM areas WHERE slug = 'portals-nous' LIMIT 1;
  SELECT id INTO puerto_portals_area_id FROM areas WHERE slug = 'puerto-portals' LIMIT 1;
  SELECT id INTO santa_ponsa_area_id FROM areas WHERE slug = 'santa-ponsa' LIMIT 1;

  IF agencies_category_id IS NULL OR water_sports_category_id IS NULL OR dining_category_id IS NULL THEN
    RAISE EXCEPTION 'Required category slugs are missing for partner seed migration';
  END IF;

  IF portals_nous_area_id IS NULL OR puerto_portals_area_id IS NULL OR santa_ponsa_area_id IS NULL THEN
    RAISE EXCEPTION 'Required area slugs are missing for partner seed migration';
  END IF;

  INSERT INTO listings (
    id,
    category_id,
    name,
    description,
    contact_phone,
    contact_email,
    website_url,
    address,
    neighborhood,
    social_media,
    tags,
    is_featured,
    image_url
  )
  VALUES
    (
      'd9100000-0000-0000-0000-000000000001',
      agencies_category_id,
      'The Agency',
      'Luxury real estate advisory focused on premium villas and investments in southwest Mallorca.',
      '',
      '',
      'https://calvia.app',
      'Puerto Portals, Calvia',
      'Puerto Portals',
      '{}'::jsonb,
      ARRAY['real-estate', 'luxury', 'verified-partner']::text[],
      true,
      ''
    ),
    (
      'd9100000-0000-0000-0000-000000000002',
      water_sports_category_id,
      'Rib Club',
      'Premium boating club for coastal experiences, private outings, and sea access around Calvia.',
      '',
      '',
      'https://calvia.app',
      'Santa Ponsa, Calvia',
      'Santa Ponsa',
      '{}'::jsonb,
      ARRAY['boating', 'club', 'verified-partner']::text[],
      true,
      ''
    ),
    (
      'd9100000-0000-0000-0000-000000000003',
      dining_category_id,
      'Just Curry',
      'Indian restaurant in Portals Nous with modern curries, tandoori dishes, and takeaway options.',
      '',
      '',
      'https://calvia.app',
      'Portals Nous, Calvia',
      'Portals Nous',
      '{}'::jsonb,
      ARRAY['restaurant', 'indian', 'verified-partner']::text[],
      true,
      ''
    )
  ON CONFLICT (id)
  DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    website_url = EXCLUDED.website_url,
    address = EXCLUDED.address,
    neighborhood = EXCLUDED.neighborhood,
    tags = EXCLUDED.tags,
    is_featured = EXCLUDED.is_featured;

  INSERT INTO businesses (
    id,
    name,
    slug,
    description,
    category_id,
    area_id,
    phone,
    email,
    website,
    address,
    latitude,
    longitude,
    is_placeholder,
    social_links,
    image_url,
    images,
    opening_hours,
    claimed,
    view_count,
    location_confidence,
    needs_geocoding,
    partner_status,
    partner_tier,
    partner_verified_at
  )
  VALUES
    (
      'f1000000-0000-0000-0000-000000000001',
      'The Agency',
      'the-agency',
      'Luxury real estate agency for high-end properties and advisory in southwest Mallorca.',
      agencies_category_id,
      puerto_portals_area_id,
      '',
      '',
      'https://calvia.app',
      'Puerto Portals, Calvia',
      39.5372,
      2.5753,
      false,
      '{}'::jsonb,
      '',
      '[]'::jsonb,
      '{}'::jsonb,
      true,
      0,
      'area',
      false,
      'verified',
      'verified',
      now()
    ),
    (
      'f1000000-0000-0000-0000-000000000002',
      'Rib Club',
      'rib-club',
      'Boating club offering premium RIB and coastal experiences from Calvia marinas.',
      water_sports_category_id,
      santa_ponsa_area_id,
      '',
      '',
      'https://calvia.app',
      'Santa Ponsa, Calvia',
      39.5082,
      2.4768,
      false,
      '{}'::jsonb,
      '',
      '[]'::jsonb,
      '{}'::jsonb,
      true,
      0,
      'area',
      false,
      'verified',
      'verified',
      now()
    ),
    (
      'f1000000-0000-0000-0000-000000000003',
      'Just Curry',
      'just-curry',
      'Restaurant in Portals Nous focused on Indian cuisine and modern curry dishes.',
      dining_category_id,
      portals_nous_area_id,
      '',
      '',
      'https://calvia.app',
      'Portals Nous, Calvia',
      39.5358,
      2.5706,
      false,
      '{}'::jsonb,
      '',
      '[]'::jsonb,
      '{}'::jsonb,
      true,
      0,
      'area',
      false,
      'verified',
      'verified',
      now()
    )
  ON CONFLICT (slug)
  DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    area_id = EXCLUDED.area_id,
    website = EXCLUDED.website,
    address = EXCLUDED.address,
    is_placeholder = false,
    claimed = true,
    location_confidence = 'area',
    partner_status = 'verified',
    partner_tier = COALESCE(NULLIF(businesses.partner_tier, ''), 'verified'),
    partner_verified_at = COALESCE(businesses.partner_verified_at, now());

  INSERT INTO business_listing_map (business_id, listing_id)
  VALUES
    ('f1000000-0000-0000-0000-000000000001', 'd9100000-0000-0000-0000-000000000001'),
    ('f1000000-0000-0000-0000-000000000002', 'd9100000-0000-0000-0000-000000000002'),
    ('f1000000-0000-0000-0000-000000000003', 'd9100000-0000-0000-0000-000000000003')
  ON CONFLICT (business_id)
  DO UPDATE SET listing_id = EXCLUDED.listing_id, updated_at = now();

  INSERT INTO business_memberships (business_id, user_id, role, status)
  SELECT b.id, b.owner_id, 'owner', 'active'
  FROM businesses b
  WHERE b.slug IN ('the-agency', 'rib-club', 'just-curry')
    AND b.owner_id IS NOT NULL
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET role = 'owner', status = 'active', updated_at = now();
END $$;
