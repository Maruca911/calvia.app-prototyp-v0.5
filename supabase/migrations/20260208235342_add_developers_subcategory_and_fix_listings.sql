/*
  # Add Developers sub-category and fix real estate listings

  1. New Sub-Categories
    - `Developers` under Real Estate - New-build developments and property developers

  2. Data Changes
    - Remove incorrect Domus Vivendi entries from Agencies
    - Add Domus Vivendi Group as a Developer
    - Add Aedas Homes as a Developer
    - Add XO Jonquet as a Developer
    - Add Fraeulein Fritz Real Estate to Agencies
    - Add Kensington International to Agencies
*/

INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id) VALUES
  ('b1000000-0000-0000-0000-000000000004', 'Developers', 'developers', 'New-build luxury developments and property developers', 'building', 4, 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;
