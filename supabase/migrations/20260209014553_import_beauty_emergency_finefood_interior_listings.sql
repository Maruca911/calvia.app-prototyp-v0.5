/*
  # Import new listings: Beauty, Emergency, Fine Food, Interior Design

  1. New Listings - Hair & Beauty (15 entries)
    - Gemini Salon, Glow Solarium, Denise Beauty Salon, KT's Salon,
      Anna Ustymenko, We Concept Hair, Beauty Lab Mallorca, Singular Salon,
      Edita Beauty Specialist, Beauty Salon Mallorca, MD Hair & Beauty,
      Feliz Hair, Nail Salon Paradise, Lash & Beauty Studio, Beauty Bliss Spa

  2. New Listings - Emergency Services (8 entries)
    - General Emergency (112), Medical Emergency (061),
      Fire Brigade Calvia, Local Police, National Police,
      Guardia Civil, Palma Fire Brigade, Civil Protection

  3. New Listings - Fine Food & Deli (7 entries)
    - Wine&More Feinkost, Feinkost Farnetani, HG Mallorca,
      Delicioso, Cidon Supermarkets, Sa Botiga, Mundi Culinario

  4. New Listings - Interior Design (11 entries)
    - Knox Design, Espacio Home Design, Justine Knox, Degüayhaus,
      Studio Butters, Syzygy Interior Concept, Isabel de Juan,
      Jaime Salva, Almond Grove Interiors, Stork Interior Design,
      Sarah Jane Nielsen

  5. Notes
    - All listings use existing category IDs
    - Phone numbers standardised to +34 format where applicable
*/

-- BEAUTY LISTINGS (category: Hair & Beauty = b4000000-0000-0000-0000-000000000003)
INSERT INTO listings (name, description, category_id, contact_phone, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('Gemini Salon Mallorca', 'Full-service hair salon offering cuts, colouring, and styling for men and women.', 'b4000000-0000-0000-0000-000000000003', '+34 971 097 528', '', '{"instagram": "https://instagram.com/geminisalonmallorca"}', 'Calvia', false, '{"hair", "salon", "colouring", "styling"}'),
  ('Glow Solarium & Beauty', 'Solarium and beauty treatments including facials and body care.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/glow.solarium"}', 'Calvia', false, '{"solarium", "beauty", "facial", "tanning"}'),
  ('Denise Beauty Salon', 'Professional beauty salon specialising in skincare treatments and aesthetic services.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/denisebeautysalon"}', 'Calvia', false, '{"beauty", "skincare", "aesthetic"}'),
  ('KT''s Salon Magaluf', 'Popular hair salon in Magaluf offering cuts, colour, and blow-dries.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/ktssalonmagaluf"}', 'Magaluf', false, '{"hair", "salon", "cuts", "colour"}'),
  ('Anna Ustymenko Makeup & Hair Artist', 'Professional makeup and hair artist for events, weddings, and special occasions.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/anya_ustymenko_"}', 'Calvia', false, '{"makeup", "hair", "bridal", "events"}'),
  ('We Concept Hair', 'Modern hair studio offering creative cuts, colour work, and hair treatments.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/weconcepthair"}', 'Calvia', false, '{"hair", "salon", "colour", "treatments"}'),
  ('Beauty Lab Mallorca', 'Beauty studio offering a range of facial and body treatments.', 'b4000000-0000-0000-0000-000000000003', '+34 623 728 450', '', '{"instagram": "https://instagram.com/beautylab_mallorca"}', 'Calvia', false, '{"beauty", "facial", "body", "treatments"}'),
  ('Singular Salon', 'Contemporary hair salon providing personalised styling and colour services.', 'b4000000-0000-0000-0000-000000000003', '+34 971 123 456', 'https://www.singularsalon.com', '{}', 'Calvia', false, '{"hair", "salon", "styling", "colour"}'),
  ('Edita Beauty Specialist', 'Dedicated beauty specialist offering personalised facial and body care.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/mallorcabeautyedita"}', 'Calvia', false, '{"beauty", "facial", "specialist"}'),
  ('Beauty Salon Mallorca', 'Full-service beauty salon with cosmetics and skincare treatments.', 'b4000000-0000-0000-0000-000000000003', '', '', '{"instagram": "https://instagram.com/balearcosmetics"}', 'Calvia', false, '{"beauty", "cosmetics", "skincare"}'),
  ('MD Hair & Beauty Salon', 'Hair and beauty salon offering a complete range of salon services.', 'b4000000-0000-0000-0000-000000000003', '', '', '{}', 'Calvia', false, '{"hair", "beauty", "salon"}'),
  ('Feliz Hair', 'Friendly hair salon for cuts, styling, and colour treatments.', 'b4000000-0000-0000-0000-000000000003', '', '', '{}', 'Calvia', false, '{"hair", "cuts", "styling"}'),
  ('Nail Salon Paradise', 'Specialist nail salon offering manicures, pedicures, and nail art.', 'b4000000-0000-0000-0000-000000000003', '+34 971 690 123', 'https://www.nailsalonparadisecalvia.com', '{}', 'Calvia', false, '{"nails", "manicure", "pedicure", "nail-art"}'),
  ('Lash & Beauty Studio', 'Eyelash extensions, lifts, and beauty treatments by trained technicians.', 'b4000000-0000-0000-0000-000000000003', '+34 971 682 456', 'https://www.lashandbeautystudiocalvia.com', '{}', 'Calvia', false, '{"lash", "eyelash", "beauty", "extensions"}'),
  ('Beauty Bliss Spa', 'Relaxing spa and beauty centre with a range of pampering treatments.', 'b4000000-0000-0000-0000-000000000003', '', '', '{}', 'Calvia', false, '{"spa", "beauty", "relaxation", "treatments"}');

-- EMERGENCY NUMBERS (category: ba000000-0000-0000-0000-000000000001)
INSERT INTO listings (name, description, category_id, contact_phone, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('General Emergency (112)', 'The universal emergency number for all emergency services in Spain and the EU.', 'ba000000-0000-0000-0000-000000000001', '112', '', '{}', 'Calvia', true, '{"emergency", "112", "urgent"}'),
  ('Medical Emergency / Ambulance (061)', 'Direct line for medical emergencies and ambulance dispatch in the Balearic Islands.', 'ba000000-0000-0000-0000-000000000001', '061', '', '{}', 'Calvia', true, '{"medical", "ambulance", "061", "health"}');

-- POLICE (category: ba000000-0000-0000-0000-000000000002)
INSERT INTO listings (name, description, category_id, contact_phone, contact_email, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('Local Police Calvia', 'Policia Local de Calvia for non-emergency local policing and community safety.', 'ba000000-0000-0000-0000-000000000002', '+34 971 690 116', 'policia@calvia.com', 'https://www.calvia.com', '{}', 'Calvia', true, '{"police", "policia", "local", "safety"}'),
  ('National Police (091)', 'Cuerpo Nacional de Policia for serious crime, immigration, and national security matters.', 'ba000000-0000-0000-0000-000000000002', '091', '', '', '{}', 'Calvia', false, '{"police", "national", "091"}'),
  ('Guardia Civil (062)', 'Spain''s rural and border security force covering areas outside municipal centres.', 'ba000000-0000-0000-0000-000000000002', '062', '', '', '{}', 'Calvia', false, '{"guardia-civil", "062", "security"}');

-- FIRE & CIVIL PROTECTION (category: ba000000-0000-0000-0000-000000000003)
INSERT INTO listings (name, description, category_id, contact_phone, contact_email, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('Fire Brigade Calvia', 'Bomberos de Calvia providing fire and rescue services across the municipality.', 'ba000000-0000-0000-0000-000000000003', '+34 971 690 000', '', 'https://www.calvia.com', '{}', 'Calvia', true, '{"fire", "bomberos", "rescue"}'),
  ('Palma Fire Brigade', 'Bomberos de Palma providing regional fire support and specialist rescue.', 'ba000000-0000-0000-0000-000000000003', '+34 971 432 749', 'bombers@palma.cat', 'https://visitpalma.com', '{}', 'Palma', false, '{"fire", "bomberos", "palma"}'),
  ('Civil Protection (112)', 'Proteccion Civil coordinating disaster response and public safety in emergencies.', 'ba000000-0000-0000-0000-000000000003', '112', 'protecciocivilpalma@gmail.com', 'https://visitpalma.com', '{}', 'Calvia', false, '{"civil-protection", "emergency", "disaster"}');

-- FINE FOOD & DELI (category: b6000000-0000-0000-0000-000000000004)
INSERT INTO listings (name, description, category_id, contact_phone, contact_email, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('Wine&More Feinkost Mallorca', 'German-style delicatessen and wine shop with curated selection of fine wines and gourmet products.', 'b6000000-0000-0000-0000-000000000004', '+34 971 699 302', 'info@wineandmore.wine', '', '{}', 'Calvia', false, '{"wine", "deli", "gourmet", "feinkost"}'),
  ('Feinkost Farnetani', 'Italian-inspired fine food store offering premium imported delicacies and speciality products.', 'b6000000-0000-0000-0000-000000000004', '+34 971 699 302', '', '', '{}', 'Calvia', false, '{"deli", "italian", "fine-food", "feinkost"}'),
  ('HG Mallorca', 'Gourmet food shop and deli specialising in artisan local and imported products.', 'b6000000-0000-0000-0000-000000000004', '+34 971 104 941', '', 'https://www.hgmallorca.es', '{"instagram": "https://instagram.com/hgmallorca"}', 'Calvia', false, '{"gourmet", "deli", "artisan", "food"}'),
  ('Delicioso', 'Delicatessen and catering service offering fresh prepared foods and gourmet products.', 'b6000000-0000-0000-0000-000000000004', '+34 971 699 221', 'info@deli-delicioso.com', 'https://www.deli-delicioso.com', '{}', 'Calvia', false, '{"deli", "catering", "prepared-food"}'),
  ('Cidon Supermarkets', 'Local supermarket chain with a good selection of Spanish and international products.', 'b6000000-0000-0000-0000-000000000004', '+34 971 675 294', '', 'https://www.supermercadocidon.com', '{}', 'Portals Nous', false, '{"supermarket", "grocery", "local"}'),
  ('Sa Botiga', 'Traditional Mallorcan shop offering local produce, wines, and artisan goods.', 'b6000000-0000-0000-0000-000000000004', '+34 971 694 890', '', '', '{}', 'Calvia', false, '{"local", "mallorcan", "artisan", "wine"}'),
  ('Mundi Culinario', 'International culinary shop with speciality ingredients and gourmet food items.', 'b6000000-0000-0000-0000-000000000004', '+34 971 694 890', '', '', '{}', 'Calvia', false, '{"culinary", "gourmet", "international", "speciality"}');

-- INTERIOR DESIGN (category: b9000000-0000-0000-0000-000000000004)
INSERT INTO listings (name, description, category_id, contact_phone, contact_email, website_url, social_media, neighborhood, is_featured, tags)
VALUES
  ('Knox Design', 'Established interior design showroom and consultancy with a wide range of furniture and decor.', 'b9000000-0000-0000-0000-000000000004', '+34 971 693 092', '', 'https://knoxdesign.net', '{}', 'Calvia', true, '{"interior", "design", "furniture", "showroom"}'),
  ('Espacio Home Design', 'Contemporary home design studio offering furniture, lighting, and interior styling services.', 'b9000000-0000-0000-0000-000000000004', '', '', 'https://espaciohomedesign.com', '{}', 'Calvia', false, '{"interior", "home", "furniture", "lighting"}'),
  ('Justine Knox', 'Personal interior design consultancy offering bespoke residential and commercial projects.', 'b9000000-0000-0000-0000-000000000004', '+34 971 693 092', 'hello@justineknox.com', 'https://justineknox.com', '{}', 'Calvia', false, '{"interior", "design", "bespoke", "residential"}'),
  ('Degüayhaus', 'Creative interior design studio blending modern aesthetics with Mediterranean warmth.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{"instagram": "https://instagram.com/deguayhaus"}', 'Calvia', false, '{"interior", "design", "modern", "mediterranean"}'),
  ('Studio Butters', 'Boutique interior design practice specialising in high-end residential renovations.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "renovation", "luxury"}'),
  ('Syzygy Interior Concept', 'Concept-driven interior design firm creating unique, curated living spaces.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "concept", "curated"}'),
  ('Isabel de Juan Interiors', 'Experienced interior designer offering full-service residential and hospitality projects.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "residential", "hospitality"}'),
  ('Jaime Salva', 'Interior designer with a refined Mediterranean style and attention to local craftsmanship.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "mediterranean", "craftsmanship"}'),
  ('Almond Grove Interiors', 'Full-service interior design studio with a focus on relaxed Mediterranean living.', 'b9000000-0000-0000-0000-000000000004', '', 'info@almondgroveinteriors.com', 'https://almondgroveinteriors.com', '{}', 'Calvia', false, '{"interior", "design", "mediterranean", "living"}'),
  ('Stork Interior Design', 'Professional interior design services for villas, apartments, and commercial spaces.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "villa", "commercial"}'),
  ('Sarah Jane Nielsen', 'Independent interior designer specialising in contemporary Mallorcan home styling.', 'b9000000-0000-0000-0000-000000000004', '', '', '', '{}', 'Calvia', false, '{"interior", "design", "contemporary", "mallorcan"}');
