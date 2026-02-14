/*
  # Seed Remaining Empty Subcategories

  Adds a small starter set of listings for subcategories that were present but
  had 0 listings, which makes Discover pages appear "empty".

  Non-destructive:
  - Insert-only with fixed UUIDs
  - Uses ON CONFLICT (id) DO NOTHING to avoid overwriting any later edits
*/

INSERT INTO listings (
  id,
  category_id,
  name,
  description,
  image_url,
  contact_phone,
  website_url,
  address,
  neighborhood,
  price_range,
  is_featured,
  tags,
  social_media
)
VALUES
  -- Real Estate -> Developers (b100...0004)
  (
    'd1000000-0000-0000-0000-000000000201',
    'b1000000-0000-0000-0000-000000000004',
    'Aedas Homes Mallorca',
    'New-build developments and modern residences across Calvia and the southwest coast. Showroom visits by appointment.',
    'https://images.pexels.com/photos/323781/pexels-photo-323781.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    'https://aedas-homes.es',
    'Calvia, Mallorca',
    'Santa Ponsa',
    '$$$$',
    true,
    ARRAY['developers', 'new-build', 'property', 'sales'],
    '{}'::jsonb
  ),
  (
    'd1000000-0000-0000-0000-000000000202',
    'b1000000-0000-0000-0000-000000000004',
    'XO Jonquet Developments',
    'Boutique property development and renovation projects with a focus on design-led coastal living.',
    'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Southwest Mallorca',
    'Portals Nous',
    '$$$$',
    false,
    ARRAY['developers', 'renovation', 'design', 'luxury'],
    '{}'::jsonb
  ),
  (
    'd1000000-0000-0000-0000-000000000203',
    'b1000000-0000-0000-0000-000000000004',
    'Calvia Coastal Developments',
    'Local developer focused on small to mid-size residential projects and turnkey renovations.',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Calvia area',
    'Calvia Village',
    '$$$',
    false,
    ARRAY['developers', 'renovation', 'turnkey'],
    '{}'::jsonb
  ),

  -- Dining -> Tapas Bars (b200...0005)
  (
    'd2000000-0000-0000-0000-000000000201',
    'b2000000-0000-0000-0000-000000000005',
    'Oliu Tapas & Wine',
    'Small plates, local wines, and seasonal specials in a relaxed setting. Ideal for an evening tapas crawl.',
    'https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Portals Nous, Mallorca',
    'Portals Nous',
    '$$',
    true,
    ARRAY['tapas', 'wine', 'small-plates', 'spanish'],
    '{}'::jsonb
  ),
  (
    'd2000000-0000-0000-0000-000000000202',
    'b2000000-0000-0000-0000-000000000005',
    'Casa Tradicional Tapas',
    'Classic tapas favourites and Mallorcan comfort dishes with generous portions and friendly service.',
    'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Santa Ponsa, Mallorca',
    'Santa Ponsa',
    '$$',
    false,
    ARRAY['tapas', 'mallorcan', 'classic'],
    '{}'::jsonb
  ),
  (
    'd2000000-0000-0000-0000-000000000203',
    'b2000000-0000-0000-0000-000000000005',
    'La Mar Tapas Bar',
    'Seafood-forward tapas and grilled specials close to the promenade. Great for a casual sunset meal.',
    'https://images.pexels.com/photos/8477296/pexels-photo-8477296.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Palmanova, Mallorca',
    'Palmanova',
    '$$',
    false,
    ARRAY['tapas', 'seafood', 'grill'],
    '{}'::jsonb
  ),

  -- Dining -> International Cuisine (b200...0007)
  (
    'd2000000-0000-0000-0000-000000000204',
    'b2000000-0000-0000-0000-000000000007',
    'Sakura Sushi Portals',
    'Modern Japanese dining with sushi, sashimi, and warm plates. Reservations recommended on weekends.',
    'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Portals Nous, Mallorca',
    'Portals Nous',
    '$$$',
    true,
    ARRAY['japanese', 'sushi', 'international'],
    '{}'::jsonb
  ),
  (
    'd2000000-0000-0000-0000-000000000205',
    'b2000000-0000-0000-0000-000000000007',
    'Bombay Spice Calvia',
    'Indian classics, vegetarian options, and house-made naan. Family-friendly and great for takeaway.',
    'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Calvia Village, Mallorca',
    'Calvia Village',
    '$$',
    false,
    ARRAY['indian', 'curry', 'vegetarian', 'international'],
    '{}'::jsonb
  ),
  (
    'd2000000-0000-0000-0000-000000000206',
    'b2000000-0000-0000-0000-000000000007',
    'Thai Garden Santa Ponsa',
    'Fresh Thai favourites with spice levels to order. Light, bright flavours and generous portions.',
    'https://images.pexels.com/photos/11101322/pexels-photo-11101322.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Santa Ponsa, Mallorca',
    'Santa Ponsa',
    '$$',
    false,
    ARRAY['thai', 'noodles', 'spicy', 'international'],
    '{}'::jsonb
  ),

  -- Activities -> Padel (b300...0006)
  (
    'd3000000-0000-0000-0000-000000000201',
    'b3000000-0000-0000-0000-000000000006',
    'Club Padel Calvia',
    'Outdoor and covered padel courts with coaching sessions for all levels. Racquet rental available.',
    'https://images.pexels.com/photos/8224733/pexels-photo-8224733.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Calvia, Mallorca',
    'Calvia Village',
    '$$',
    true,
    ARRAY['padel', 'courts', 'coaching', 'sports'],
    '{}'::jsonb
  ),
  (
    'd3000000-0000-0000-0000-000000000202',
    'b3000000-0000-0000-0000-000000000006',
    'Santa Ponsa Padel Courts',
    'Friendly padel club with evening leagues and beginner clinics. Book courts online or by phone.',
    'https://images.pexels.com/photos/8224729/pexels-photo-8224729.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Santa Ponsa, Mallorca',
    'Santa Ponsa',
    '$$',
    false,
    ARRAY['padel', 'league', 'beginner'],
    '{}'::jsonb
  ),
  (
    'd3000000-0000-0000-0000-000000000203',
    'b3000000-0000-0000-0000-000000000006',
    'Portals Padel Club',
    'Social padel sessions and tournaments with a small clubhouse cafe. Great community vibe.',
    'https://images.pexels.com/photos/8224717/pexels-photo-8224717.jpeg?auto=compress&cs=tinysrgb&w=900',
    '',
    '',
    'Portals Nous, Mallorca',
    'Portals Nous',
    '$$$',
    false,
    ARRAY['padel', 'tournaments', 'community'],
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

