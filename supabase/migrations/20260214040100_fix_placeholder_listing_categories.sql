/*
  # Fix placeholder listing categories (for better Discover navigation)

  Some placeholder listings were seeded under parent categories (Dining/Activities/Health/Daily Life),
  but category pages only show sub-categories. This migration:
  - Adds missing sub-categories used by those placeholders (Golf, Wellness)
  - Reassigns the placeholder listings into the correct sub-categories

  Notes:
  - Additive only (no deletes)
  - Idempotent: safe to run multiple times
*/

-- Activities: Golf
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES (
  'b3000000-0000-0000-0000-000000000008',
  'Golf',
  'golf',
  'Golf courses, tee times, and golf experiences',
  'flag',
  5,
  'a1000000-0000-0000-0000-000000000003'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- Health & Medical: Wellness
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES (
  'b5000000-0000-0000-0000-000000000004',
  'Wellness',
  'wellness',
  'Studios, spas, yoga, and wellbeing',
  'smile',
  4,
  'a1000000-0000-0000-0000-000000000005'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- Reclassify placeholder listings into correct sub-categories
UPDATE listings
SET category_id = 'b2000000-0000-0000-0000-000000000006' -- Fine Dining
WHERE id IN (
  'c3000000-0000-0000-0000-000000000006', -- Restaurant Sa Vinya
  'd3000000-0000-0000-0000-000000000001'  -- Beso Beach
);

UPDATE listings
SET category_id = 'b3000000-0000-0000-0000-000000000007' -- Water Sports
WHERE id = 'd5000000-0000-0000-0000-000000000003'; -- Axopar Day Charter

UPDATE listings
SET category_id = 'b3000000-0000-0000-0000-000000000008' -- Golf
WHERE id = 'a8dad092-b92d-437c-bcdd-da0c204de163'; -- Golf Santa Ponsa

UPDATE listings
SET category_id = 'b9000000-0000-0000-0000-000000000002' -- Cleaning Services
WHERE id = 'c6000000-0000-0000-0000-000000000003'; -- Home Cleaning Service

UPDATE listings
SET category_id = 'b5000000-0000-0000-0000-000000000004' -- Wellness
WHERE id IN (
  '84418015-8c5f-46e1-99b0-3a71fa02eb87', -- Bendinat Wellness
  'd8000000-0000-0000-0000-000000000009'  -- Portals De Yoga
);

