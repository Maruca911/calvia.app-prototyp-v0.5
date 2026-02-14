/*
  # Seed Daily Deals and Digest Data

  1. Changes
    - Link 8 existing deals to real listings via listing_id
    - Assign deal_date to several deals for daily rotation
    - Mark 2 deals as premium-only
    - Insert 7 days of daily digest data with weather, news, and events
    - Add 4 new deals specifically designed for "Deal of the Day" rotation

  2. Notes
    - Daily deals rotate by matching deal_date to current date
  - Digest data covers a full week for demonstration
  - Weather data is realistic for Calvia/Mallorca in February
*/

-- Ensure the listings referenced below exist (FK-safe, additive only).
-- These UUIDs are used by this migration to link deals -> listings.
INSERT INTO listings (id, category_id, name, description, image_url, website_url, address, is_featured)
VALUES
  (
    'c3000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000002',
    'Restaurant Sa Vinya',
    'Local dining spot in Calvia. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Calvia, Mallorca',
    true
  ),
  (
    '84418015-8c5f-46e1-99b0-3a71fa02eb87',
    'a1000000-0000-0000-0000-000000000005',
    'Bendinat Wellness',
    'Spa and wellness center. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Bendinat, Mallorca',
    true
  ),
  (
    'd5000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000003',
    'Axopar Day Charter',
    'Boat charter experience. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Calvia Coast, Mallorca',
    true
  ),
  (
    'a8dad092-b92d-437c-bcdd-da0c204de163',
    'a1000000-0000-0000-0000-000000000003',
    'Golf Santa Ponsa',
    'Golf course offer. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/62556/golf-tee-golf-ball-golf-club-62556.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Santa Ponsa, Mallorca',
    true
  ),
  (
    'c6000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'Home Cleaning Service',
    'Home services listing. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/4239010/pexels-photo-4239010.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Calvia, Mallorca',
    false
  ),
  (
    '644f20c1-acb9-479a-a299-cfaea106b6ce',
    'b4000000-0000-0000-0000-000000000003',
    'Bliss Salon',
    'Hair and beauty studio. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Calvia, Mallorca',
    true
  ),
  (
    'd8000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000005',
    'Portals De Yoga',
    'Yoga studio. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Portals Nous, Mallorca',
    true
  ),
  (
    'd3000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'Beso Beach',
    'Beach dining experience. Referenced by daily deals rotation.',
    'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600',
    '',
    'Mallorca',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  website_url = EXCLUDED.website_url,
  address = EXCLUDED.address,
  is_featured = EXCLUDED.is_featured;

-- Link existing deals to real listings
UPDATE deals SET listing_id = 'c3000000-0000-0000-0000-000000000006'
WHERE title = 'Welcome Dinner at Sa Vinya' AND listing_id IS NULL;

UPDATE deals SET listing_id = '84418015-8c5f-46e1-99b0-3a71fa02eb87'
WHERE title = 'Spa Day at Bendinat Wellness' AND listing_id IS NULL;

UPDATE deals SET listing_id = 'd5000000-0000-0000-0000-000000000003'
WHERE title = 'Sunset Sailing Experience' AND listing_id IS NULL;

UPDATE deals SET listing_id = 'a8dad092-b92d-437c-bcdd-da0c204de163'
WHERE title = 'Golf Green Fee Discount' AND listing_id IS NULL;

UPDATE deals SET listing_id = 'c6000000-0000-0000-0000-000000000003'
WHERE title = 'Home Cleaning Trial' AND listing_id IS NULL;

UPDATE deals SET listing_id = '644f20c1-acb9-479a-a299-cfaea106b6ce'
WHERE title = 'Hair Styling at Bliss Salon' AND listing_id IS NULL;

UPDATE deals SET listing_id = 'd8000000-0000-0000-0000-000000000009'
WHERE title = 'Yoga Retreat Morning Pass' AND listing_id IS NULL;

-- Mark 2 deals as premium-only
UPDATE deals SET is_premium_only = true WHERE title = 'Sunset Sailing Experience';
UPDATE deals SET is_premium_only = true WHERE title = 'Golf Green Fee Discount';

-- Assign deal_dates for daily rotation (7-day cycle starting today)
UPDATE deals SET deal_date = CURRENT_DATE WHERE title = 'Welcome Dinner at Sa Vinya';
UPDATE deals SET deal_date = CURRENT_DATE + 1 WHERE title = 'Spa Day at Bendinat Wellness';
UPDATE deals SET deal_date = CURRENT_DATE + 2 WHERE title = 'Hair Styling at Bliss Salon';
UPDATE deals SET deal_date = CURRENT_DATE + 3 WHERE title = 'Yoga Retreat Morning Pass';
UPDATE deals SET deal_date = CURRENT_DATE + 4 WHERE title = 'Home Cleaning Trial';
UPDATE deals SET deal_date = CURRENT_DATE + 5 WHERE title = 'Wine Tasting Evening';
UPDATE deals SET deal_date = CURRENT_DATE + 6 WHERE title = 'Fresh Market Box';

-- Insert additional deals for richer daily rotation
INSERT INTO deals (title, description, discount_text, valid_until, is_active, image_url, category, deal_date, listing_id)
VALUES
  ('Beso Beach Sunset Menu', 'Exclusive 3-course sunset dining experience at Beso Beach with welcome cocktail and live music.', '20% OFF', CURRENT_DATE + interval '60 days', true, 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600', 'Dining', CURRENT_DATE, 'd3000000-0000-0000-0000-000000000001'),
  ('Bodhana Full Day Retreat', 'Full day wellness retreat including massage, facial, lunch and pool access at Bodhana Wellness Centre.', '35% OFF', CURRENT_DATE + interval '45 days', true, 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=600', 'Wellness', CURRENT_DATE + 1, '84418015-8c5f-46e1-99b0-3a71fa02eb87'),
  ('Axopar Day Charter', 'Full day Axopar boat charter around Calvia coastline. Includes skipper, fuel and snorkelling gear.', '15% OFF', CURRENT_DATE + interval '90 days', true, 'https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=600', 'Activities', CURRENT_DATE + 2, 'd5000000-0000-0000-0000-000000000003'),
  ('Portals De Yoga Monthly Pass', 'Unlimited yoga classes for one month at the beautiful Portals De Yoga studio overlooking the sea.', 'First Month 50% OFF', CURRENT_DATE + interval '30 days', true, 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=600', 'Wellness', CURRENT_DATE + 3, 'd8000000-0000-0000-0000-000000000009');

-- Seed 7 days of daily digests
INSERT INTO daily_digests (digest_date, weather_summary, weather_temp_high, weather_temp_low, weather_icon, news_items, featured_events, premium_deals) VALUES
(CURRENT_DATE, 'Sunny with light clouds. Perfect day for outdoor dining or a coastal walk.', 18, 10, 'sun',
 '[{"title": "Port Adriano hosts new winter yacht show", "source": "Mallorca Daily"}, {"title": "Calvia council announces beach restoration project for 2026 season", "source": "Diario de Mallorca"}, {"title": "New cycling route connecting Santa Ponsa to Peguera opens", "source": "Ultima Hora"}]',
 '[{"title": "Saturday Market at Santa Ponsa", "date": "This Saturday", "location": "Plaza Santa Ponsa"}, {"title": "Live Jazz at Port Adriano", "date": "Friday Evening", "location": "Port Adriano"}, {"title": "Wine & Tapas Festival", "date": "This Weekend", "location": "Bendinat"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 1, 'Partly cloudy with afternoon sunshine. Mild temperatures, great for golf or padel.', 17, 11, 'cloud-sun',
 '[{"title": "Mallorca property prices rise 8% in southwest region", "source": "Mallorca Zeitung"}, {"title": "New international school opening in Sol de Mallorca", "source": "Euro Weekly"}, {"title": "Calvia gastronomy week announced for March", "source": "Ultima Hora"}]',
 '[{"title": "Farmers Market Andratx", "date": "Wednesday", "location": "Andratx Town"}, {"title": "Art Exhibition Opening", "date": "Thursday", "location": "Galeria CCA"}, {"title": "Padel Tournament", "date": "This Weekend", "location": "TC Calvia"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 2, 'Clear skies all day. UV index moderate. Apply sunscreen for outdoor activities.', 19, 11, 'sun',
 '[{"title": "New direct flights to Palma from 5 European cities", "source": "Mallorca Magazine"}, {"title": "Santa Ponsa marina expansion approved", "source": "Diario de Mallorca"}, {"title": "Local restaurants prepare for Semana Santa menus", "source": "Gastro Mallorca"}]',
 '[{"title": "Sunset Yoga at the Beach", "date": "Thursday", "location": "Peguera Beach"}, {"title": "Classic Car Rally", "date": "Saturday", "location": "Calviatown"}, {"title": "Kids Sailing Regatta", "date": "Sunday", "location": "Port Adriano"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 3, 'Morning fog clearing to sunshine by midday. Warm afternoon expected.', 20, 12, 'cloud-sun',
 '[{"title": "Calvia voted best municipality for expats in Balearics", "source": "Spain in English"}, {"title": "Beach club season opening dates announced", "source": "Mallorca Daily"}, {"title": "New bike-sharing scheme launches in Calvia", "source": "Ultima Hora"}]',
 '[{"title": "Tapas Crawl Evening", "date": "Friday", "location": "Portals Nous"}, {"title": "Outdoor Cinema Night", "date": "Saturday", "location": "Son Caliu Park"}, {"title": "Charity Golf Day", "date": "Sunday", "location": "Golf Santa Ponsa"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 4, 'Light breeze from the southwest. Ideal conditions for sailing and water sports.', 18, 10, 'wind',
 '[{"title": "Port Adriano hosts sustainable seafood festival", "source": "Mallorca Zeitung"}, {"title": "Calvia hiking trails get new signage", "source": "Diario de Mallorca"}, {"title": "Local olive oil wins international award", "source": "Gastro Mallorca"}]',
 '[{"title": "Portals Nous Food Market", "date": "Saturday Morning", "location": "Plaza Portals Nous"}, {"title": "Live Flamenco Show", "date": "Friday", "location": "Restaurant Sa Vinya"}, {"title": "Wellness Retreat Day", "date": "Sunday", "location": "Bodhana Centre"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 5, 'Overcast morning turning sunny. Slightly cooler temperatures. Layer up for morning activities.', 16, 9, 'cloud',
 '[{"title": "Calvia carnival celebrations announced", "source": "Ayuntamiento de Calvia"}, {"title": "New organic market opens in Palmanova", "source": "Euro Weekly"}, {"title": "Mallorca film festival selects Calvia location", "source": "Diario de Mallorca"}]',
 '[{"title": "Carnival Parade", "date": "Saturday Afternoon", "location": "Magaluf Promenade"}, {"title": "Wine Pairing Dinner", "date": "Friday", "location": "Adelfas by Jens"}, {"title": "Sunrise Hike", "date": "Sunday 7AM", "location": "Serra de Tramuntana"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]'),

(CURRENT_DATE + 6, 'Beautiful sunny day with temperatures above average. Beach weather!', 21, 13, 'sun',
 '[{"title": "Calvia tourism numbers exceed pre-pandemic levels", "source": "Mallorca Daily"}, {"title": "New rooftop bar opens at Port Adriano", "source": "Ultima Hora"}, {"title": "International regatta returns to Bay of Palma", "source": "Mallorca Zeitung"}]',
 '[{"title": "Beach Volleyball Tournament", "date": "Saturday", "location": "Palmanova Beach"}, {"title": "Artisan Craft Fair", "date": "Sunday", "location": "Calvia Village"}, {"title": "Live Music at Beso Beach", "date": "Saturday Evening", "location": "Beso Beach"}]',
 '[{"title": "Sunset Sailing 30EUR off", "discount": "30 EUR OFF"}, {"title": "Golf Green Fee 35% off", "discount": "35% OFF"}]');
