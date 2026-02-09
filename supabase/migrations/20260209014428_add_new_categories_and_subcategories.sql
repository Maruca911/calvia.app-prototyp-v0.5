/*
  # Add new categories and sub-categories

  1. New Parent Category
    - `Emergency Services` (sort_order: 10, icon: shield-alert)
      - Important safety contacts for residents and visitors

  2. New Sub-Categories under Emergency Services
    - `Emergency Numbers` - General emergency contacts (112, 061)
    - `Police` - Local, National Police, and Guardia Civil
    - `Fire & Civil Protection` - Fire brigades and civil protection

  3. New Sub-Category under Dining
    - `Catering & Private Chef` - Catering companies and private chef services

  4. New Sub-Category under Shopping
    - `Fine Food & Deli` - Specialist food stores, delis, wine shops

  5. New Sub-Category under Home Services
    - `Interior Design` - Interior designers and decorators

  6. Security
    - No changes to RLS policies (using existing table policies)
*/

-- New parent category: Emergency Services
INSERT INTO categories (id, name, slug, description, icon_name, parent_id, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000010',
  'Emergency Services',
  'emergency-services',
  'Essential emergency contacts and safety information for Calvia',
  'shield-alert',
  NULL,
  10
) ON CONFLICT (id) DO NOTHING;

-- Emergency Services sub-categories
INSERT INTO categories (id, name, slug, description, icon_name, parent_id, sort_order)
VALUES
  ('ba000000-0000-0000-0000-000000000001', 'Emergency Numbers', 'emergency-numbers', 'General emergency and medical helplines', 'phone', 'a1000000-0000-0000-0000-000000000010', 1),
  ('ba000000-0000-0000-0000-000000000002', 'Police', 'police', 'Local Police, National Police, and Guardia Civil', 'shield-check', 'a1000000-0000-0000-0000-000000000010', 2),
  ('ba000000-0000-0000-0000-000000000003', 'Fire & Civil Protection', 'fire-civil-protection', 'Fire brigades and civil protection services', 'flame', 'a1000000-0000-0000-0000-000000000010', 3)
ON CONFLICT (id) DO NOTHING;

-- New sub-category under Dining: Catering & Private Chef
INSERT INTO categories (id, name, slug, description, icon_name, parent_id, sort_order)
VALUES (
  'b2000000-0000-0000-0000-000000000008',
  'Catering & Private Chef',
  'catering-private-chef',
  'Professional catering services and personal chefs for events and private dining',
  'chef-hat',
  'a1000000-0000-0000-0000-000000000002',
  8
) ON CONFLICT (id) DO NOTHING;

-- New sub-category under Shopping: Fine Food & Deli
INSERT INTO categories (id, name, slug, description, icon_name, parent_id, sort_order)
VALUES (
  'b6000000-0000-0000-0000-000000000004',
  'Fine Food & Deli',
  'fine-food-deli',
  'Specialist food stores, delicatessens, and artisan wine shops',
  'wine',
  'a1000000-0000-0000-0000-000000000006',
  4
) ON CONFLICT (id) DO NOTHING;

-- New sub-category under Home Services: Interior Design
INSERT INTO categories (id, name, slug, description, icon_name, parent_id, sort_order)
VALUES (
  'b9000000-0000-0000-0000-000000000004',
  'Interior Design',
  'interior-design',
  'Interior designers, decorators, and home styling professionals',
  'palette',
  'a1000000-0000-0000-0000-000000000009',
  4
) ON CONFLICT (id) DO NOTHING;
