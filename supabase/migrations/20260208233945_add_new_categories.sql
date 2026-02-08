/*
  # Add new parent categories and sub-categories for Discover directory

  1. New Parent Categories
    - `Shopping` - Supermarkets, pharmacies, boutiques
    - `Education` - International schools and language academies
    - `Professional Services` - Lawyers, tax advisors, accountants
    - `Home Services` - Pool, garden, cleaning, trades

  2. New Sub-Categories under existing parents
    - Dining: Cafes & Brunch, Tapas Bars, Fine Dining, International Cuisine
    - Activities: Padel, Water Sports
    - Daily Life: Car Rental

  3. New Sub-Categories under new parents
    - Shopping: Supermarkets, Pharmacies, Boutiques & Fashion
    - Education: International Schools, Language Academies
    - Professional Services: Lawyers & Legal, Tax & Accounting
    - Home Services: Pool & Garden, Cleaning Services, Trades & Repairs
*/

INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'Shopping', 'shopping', 'Supermarkets, pharmacies, and local shops', 'shopping-bag', 6, NULL),
  ('a1000000-0000-0000-0000-000000000007', 'Education', 'education', 'International schools and language academies', 'graduation-cap', 7, NULL),
  ('a1000000-0000-0000-0000-000000000008', 'Professional Services', 'professional-services', 'Legal, tax, and business advisory', 'briefcase', 8, NULL),
  ('a1000000-0000-0000-0000-000000000009', 'Home Services', 'home-services', 'Trusted local tradespeople and home care', 'wrench', 9, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, description, icon_name, sort_order, parent_id) VALUES
  ('b2000000-0000-0000-0000-000000000004', 'Cafes & Brunch', 'cafes-brunch', 'Coffee shops, bakeries, and brunch spots', 'coffee', 4, 'a1000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000005', 'Tapas Bars', 'tapas-bars', 'Traditional and modern tapas', 'utensils-crossed', 5, 'a1000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000006', 'Fine Dining', 'fine-dining', 'Upscale and Michelin-starred restaurants', 'sparkles', 6, 'a1000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000007', 'International Cuisine', 'international-cuisine', 'Global flavours from around the world', 'globe', 7, 'a1000000-0000-0000-0000-000000000002'),
  ('b3000000-0000-0000-0000-000000000006', 'Padel', 'padel', 'Padel courts and clubs', 'circle-dot', 6, 'a1000000-0000-0000-0000-000000000003'),
  ('b3000000-0000-0000-0000-000000000007', 'Water Sports', 'water-sports', 'Kayaking, jet ski, diving, and more', 'waves', 7, 'a1000000-0000-0000-0000-000000000003'),
  ('b4000000-0000-0000-0000-000000000005', 'Car Rental', 'car-rental', 'Vehicle hire and automotive services', 'car', 5, 'a1000000-0000-0000-0000-000000000004'),
  ('b6000000-0000-0000-0000-000000000001', 'Supermarkets', 'supermarkets', 'Grocery stores and food shopping', 'shopping-cart', 1, 'a1000000-0000-0000-0000-000000000006'),
  ('b6000000-0000-0000-0000-000000000002', 'Pharmacies', 'pharmacies', 'Local pharmacies and health products', 'pill', 2, 'a1000000-0000-0000-0000-000000000006'),
  ('b6000000-0000-0000-0000-000000000003', 'Boutiques & Fashion', 'boutiques-fashion', 'Clothing, accessories, and designer shops', 'shirt', 3, 'a1000000-0000-0000-0000-000000000006'),
  ('b7000000-0000-0000-0000-000000000001', 'International Schools', 'international-schools', 'British, American, and IB curriculum schools', 'school', 1, 'a1000000-0000-0000-0000-000000000007'),
  ('b7000000-0000-0000-0000-000000000002', 'Language Academies', 'language-academies', 'Spanish, English, and other language courses', 'languages', 2, 'a1000000-0000-0000-0000-000000000007'),
  ('b8000000-0000-0000-0000-000000000001', 'Lawyers & Legal', 'lawyers-legal', 'Property law, residency, and business legal services', 'scale', 1, 'a1000000-0000-0000-0000-000000000008'),
  ('b8000000-0000-0000-0000-000000000002', 'Tax & Accounting', 'tax-accounting', 'Tax advisors and accountants for residents and expats', 'calculator', 2, 'a1000000-0000-0000-0000-000000000008'),
  ('b9000000-0000-0000-0000-000000000001', 'Pool & Garden', 'pool-garden', 'Pool maintenance, landscaping, and garden care', 'flower', 1, 'a1000000-0000-0000-0000-000000000009'),
  ('b9000000-0000-0000-0000-000000000002', 'Cleaning Services', 'cleaning-services', 'Domestic cleaning and property management', 'sparkle', 2, 'a1000000-0000-0000-0000-000000000009'),
  ('b9000000-0000-0000-0000-000000000003', 'Trades & Repairs', 'trades-repairs', 'Electricians, plumbers, and general maintenance', 'hammer', 3, 'a1000000-0000-0000-0000-000000000009')
ON CONFLICT (id) DO NOTHING;
