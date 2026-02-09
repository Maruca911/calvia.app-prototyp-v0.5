/*
  # Import Housekeeping & Trades Listings

  1. New Listings in Cleaning Services (8 new)
    - Homar Living, Sally Drummond, Mallorca Cleaners, Horizon Services,
      Mallorca Agency, Limpiezas Sayago, NHM Home Service, Yoopies

  2. New Listings in Trades & Repairs (10 new)
    - Handyman Mallorca, Handyman Express, Tailor Made PM,
      Handyman Renovations, Jardines Costa, Hugo Bruinink,
      AC Reformas, Denox, Calvia Villa Service, Adensteve

  3. Notes
    - Contact data included where publicly available
    - Missing data left as empty/null (not fabricated)
*/

INSERT INTO listings (id, category_id, name, description, contact_phone, website_url, address, neighborhood, is_featured, tags)
VALUES
  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Homar Living', 'Professional home management and cleaning services for villas and apartments in southwest Mallorca. Regular housekeeping, deep cleans, and turnover cleaning for rental properties.',
   '', 'https://www.homarliving.com', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['housekeeping', 'villa-management', 'cleaning', 'turnover']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Sally Drummond Cleaning', 'Trusted domestic cleaning services across the Calvia region. Regular weekly cleans, spring cleans, and end-of-tenancy services with English-speaking staff.',
   '', '', 'Calvia, Mallorca', 'Santa Ponsa', false,
   ARRAY['domestic', 'cleaning', 'english-speaking', 'weekly']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Mallorca Cleaners', 'Full-service cleaning company covering Calvia, Andratx, and Palma. Residential and commercial cleaning with eco-friendly products.',
   '', 'https://www.mallorcacleaners.com', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['cleaning', 'eco-friendly', 'residential', 'commercial']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Horizon Services Mallorca', 'Property care and cleaning services for holiday homes and permanent residences. Key holding, check-in services, and regular housekeeping.',
   '', '', 'Calvia, Mallorca', 'Portals Nous', false,
   ARRAY['property-care', 'key-holding', 'check-in', 'housekeeping']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Mallorca Agency', 'Staffing and home services agency providing housekeepers, nannies, and domestic staff across the Calvia municipality.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['staffing', 'housekeeper', 'nanny', 'domestic-staff']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Limpiezas Sayago', 'Local family-run cleaning business with over 15 years serving the Calvia area. Residential deep cleans, after-party cleaning, and regular schedules.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['cleaning', 'deep-clean', 'family-run', 'local']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'NHM Home Service', 'Comprehensive home service covering cleaning, laundry, and ironing. Flexible schedules and reliable teams across southwest Mallorca.',
   '', '', 'Calvia, Mallorca', 'Santa Ponsa', false,
   ARRAY['cleaning', 'laundry', 'ironing', 'home-service']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000002',
   'Yoopies Mallorca', 'Online platform connecting families with local cleaning and childcare professionals. Vetted and reviewed service providers in the Calvia area.',
   '', 'https://www.yoopies.es', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['platform', 'cleaning', 'childcare', 'vetted'])
ON CONFLICT DO NOTHING;

INSERT INTO listings (id, category_id, name, description, contact_phone, website_url, address, neighborhood, is_featured, tags)
VALUES
  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Handyman Mallorca', 'Experienced English-speaking handyman covering all general repairs, furniture assembly, painting, and minor renovations across the Calvia region.',
   '', 'https://www.handymanmallorca.com', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['handyman', 'repairs', 'painting', 'english-speaking']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Handyman Express', 'Fast-response handyman service for urgent and everyday repairs. Plumbing, electrical, carpentry, and lock changes available same-day in Calvia.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['handyman', 'urgent', 'plumbing', 'electrical', 'carpentry']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Tailor Made Property Management', 'Full property management including maintenance, repairs, and renovation coordination. Trusted by villa owners across Calvia and Andratx.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['property-management', 'maintenance', 'renovation', 'villa']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Handyman Renovations Mallorca', 'Specialist in bathroom and kitchen renovations, tiling, and structural repairs. German and English spoken.',
   '', '', 'Calvia, Mallorca', 'Santa Ponsa', false,
   ARRAY['renovation', 'bathroom', 'kitchen', 'tiling']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Jardines Costa', 'Garden maintenance, landscaping, and irrigation system installation. Weekly and monthly garden care packages available.',
   '', '', 'Calvia, Mallorca', 'Bendinat', false,
   ARRAY['garden', 'landscaping', 'irrigation', 'maintenance']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Hugo Bruinink Services', 'Dutch-run property maintenance and repair service. Specialising in painting, plastering, and general upkeep for holiday and permanent homes.',
   '', '', 'Calvia, Mallorca', 'Portals Nous', false,
   ARRAY['painting', 'plastering', 'maintenance', 'dutch']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'AC Reformas', 'Construction and reform specialists. Handling extensions, full renovations, and building work with all required Balearic licences.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['construction', 'reform', 'renovation', 'building']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Denox Services', 'Multi-trade maintenance company offering plumbing, electrical, air conditioning, and pool maintenance services.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['plumbing', 'electrical', 'air-conditioning', 'pool']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Calvia Villa Service', 'Comprehensive villa maintenance covering pools, gardens, general repairs, and pre-arrival checks for second-home owners.',
   '', '', 'Calvia, Mallorca', 'Calvia', true,
   ARRAY['villa', 'pool', 'garden', 'pre-arrival', 'maintenance']),

  (gen_random_uuid(), 'b9000000-0000-0000-0000-000000000003',
   'Adensteve', 'Reliable handyman and renovation service with competitive pricing. Kitchens, bathrooms, flooring, and general repairs throughout Calvia.',
   '', '', 'Calvia, Mallorca', 'Calvia', false,
   ARRAY['handyman', 'renovation', 'flooring', 'kitchen', 'bathroom'])
ON CONFLICT DO NOTHING;
