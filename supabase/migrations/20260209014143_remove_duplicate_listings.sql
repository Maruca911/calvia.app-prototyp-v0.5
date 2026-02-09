/*
  # Remove duplicate listings

  1. Duplicates removed (7 total)
    - Domus Vivendi Group (keeping entry with phone number)
    - Nikki Beach Mallorca (keeping one of two identical entries)
    - Golf Santa Ponsa I, II & III (keeping one of two identical entries)
    - Ritzi Puerto Portals (keeping one of two identical entries)
    - Anabel Palmanova (keeping "Annabel Palmanova" spelling)
    - Tristan (keeping Fine Dining entry, removing Local Restaurants duplicate)
    - Tuca Beach (keeping "Tuca Beach", removing "Tuca Beach Palmanova" duplicate)

  2. Notes
    - No favorites or store_visits reference these entries
    - All kept entries retain the most complete contact data
*/

DELETE FROM listings WHERE id = 'd1000000-0000-0000-0000-000000000001' AND name = 'Domus Vivendi Group';
DELETE FROM listings WHERE id = 'd3000000-0000-0000-0000-000000000005' AND name = 'Nikki Beach Mallorca';
DELETE FROM listings WHERE id = 'd7000000-0000-0000-0000-000000000013' AND name = 'Golf Santa Ponsa I, II & III';
DELETE FROM listings WHERE id = 'd2000000-0000-0000-0000-000000000002' AND name = 'Ritzi Puerto Portals';
DELETE FROM listings WHERE id = 'd4000000-0000-0000-0000-000000000009' AND name = 'Anabel Palmanova';
DELETE FROM listings WHERE id = 'ee17baab-3611-4357-90c4-0f24035be310' AND name = 'Tristán';
DELETE FROM listings WHERE id = 'd4000000-0000-0000-0000-000000000012' AND name = 'Tuca Beach Palmanova';
