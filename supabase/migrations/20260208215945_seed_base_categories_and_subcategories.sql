/*
  # Seed Base Categories and Required Sub-Categories

  This project’s later migrations assume the existence of a few “base” parent
  categories (IDs a100...0001-a100...0005). They are used as foreign-key parents
  for additional sub-categories and seeded listings.

  This migration inserts those base categories, plus a small set of required
  sub-categories referenced by listing seed migrations.

  Notes:
  - Additive only (no deletes)
  - Uses fixed UUIDs so later migrations can reference them safely
*/

-- Base parent categories (used by /discover and /home quick access)
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Real Estate', 'real-estate', 'Property, rentals, and trusted agencies', 'building-2', 1, NULL),
  ('a1000000-0000-0000-0000-000000000002', 'Dining', 'dining', 'Restaurants, cafes, and fine dining', 'utensils', 2, NULL),
  ('a1000000-0000-0000-0000-000000000003', 'Activities', 'activities', 'Sports, boats, and experiences', 'compass', 3, NULL),
  ('a1000000-0000-0000-0000-000000000004', 'Daily Life', 'daily-life', 'Everyday services, transport, and essentials', 'coffee', 4, NULL),
  ('a1000000-0000-0000-0000-000000000005', 'Health & Medical', 'health-medical', 'Clinics, doctors, and wellbeing', 'heart-pulse', 5, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- Daily Life sub-categories referenced by listing seed migrations
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES
  ('b4000000-0000-0000-0000-000000000001', 'Private Drivers', 'private-drivers', 'Chauffeurs, airport transfers, and private transport', 'car', 1, 'a1000000-0000-0000-0000-000000000004'),
  ('b4000000-0000-0000-0000-000000000002', 'Grocery & Delivery', 'grocery-delivery', 'Supermarkets, provisioning, and delivery services', 'shopping-cart', 2, 'a1000000-0000-0000-0000-000000000004'),
  ('b4000000-0000-0000-0000-000000000003', 'Hair & Beauty', 'hair-beauty', 'Salons, beauty treatments, and grooming', 'scissors', 3, 'a1000000-0000-0000-0000-000000000004'),
  ('b4000000-0000-0000-0000-000000000004', 'Natural & Organic Shops', 'natural-organic', 'Health food stores, organic produce, and eco shops', 'leaf', 4, 'a1000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- Health & Medical sub-categories referenced by listing seed migrations
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES
  ('b5000000-0000-0000-0000-000000000002', 'Eye Care', 'eye-care', 'Opticians, eye clinics, and vision care', 'eye', 2, 'a1000000-0000-0000-0000-000000000005'),
  ('b5000000-0000-0000-0000-000000000003', 'Pediatric Care', 'pediatric-care', 'Paediatricians and children''s clinics', 'baby', 3, 'a1000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

