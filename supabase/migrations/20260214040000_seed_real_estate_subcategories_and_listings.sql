/*
  # Seed Real Estate sub-categories + listings

  The app expects Real Estate to have multiple sub-categories (e.g. Agencies),
  but the repo seeds only Developers. This migration adds the missing Real Estate
  sub-categories and a small set of starter listings.

  Notes:
  - Additive only (no deletes)
  - Idempotent: safe to run multiple times
  - Uses fixed UUIDs for stable URLs and FK-safe references
*/

-- Real Estate sub-categories (parent: Real Estate)
INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Agencies', 'agencies', 'Trusted local real estate agencies', 'home', 1, 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'Rentals', 'rentals', 'Short and long-term property rentals', 'building', 2, 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000003', 'Property Management', 'property-management', 'Caretaking, key holding, and full property management', 'briefcase', 3, 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- Starter listings (minimal placeholders; refine later with accurate contact details)
INSERT INTO listings (id, category_id, name, description, website_url, address, neighborhood, tags, is_featured)
VALUES
  (
    'd1000000-0000-0000-0000-000000000101',
    'b1000000-0000-0000-0000-000000000001',
    'Domus Vivendi Group',
    'Luxury real estate agency serving Calvia and southwest Mallorca.',
    '',
    'Calvia, Mallorca',
    'Calvia',
    ARRAY['real-estate', 'agency', 'property'],
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000102',
    'b1000000-0000-0000-0000-000000000001',
    'Fraeulein Fritz Real Estate',
    'Boutique real estate agency focused on prime homes in southwest Mallorca.',
    '',
    'Calvia, Mallorca',
    'Calvia',
    ARRAY['real-estate', 'agency', 'boutique'],
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000103',
    'b1000000-0000-0000-0000-000000000001',
    'Kensington International',
    'International real estate brokerage with expertise in Mallorca property.',
    '',
    'Calvia, Mallorca',
    'Calvia',
    ARRAY['real-estate', 'agency', 'international'],
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000104',
    'b1000000-0000-0000-0000-000000000002',
    'Calvia Villa Rentals',
    'Curated holiday villa and apartment rentals across Calvia.',
    '',
    'Calvia, Mallorca',
    'Calvia',
    ARRAY['real-estate', 'rentals', 'villa'],
    false
  ),
  (
    'd1000000-0000-0000-0000-000000000105',
    'b1000000-0000-0000-0000-000000000003',
    'Calvia Property Management',
    'Property management services including caretaking, inspections, and key holding.',
    '',
    'Calvia, Mallorca',
    'Calvia',
    ARRAY['real-estate', 'property-management', 'maintenance'],
    false
  )
ON CONFLICT (id) DO NOTHING;

