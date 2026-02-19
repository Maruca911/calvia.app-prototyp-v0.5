/*
  Compatibility patch for shared calvia.app + calvia.eu reviews.

  calvia.eu seeds reviews by business_id first; listing links are filled later
  through business_listing_map and trigger bridge. listing_id must therefore be nullable.
*/

ALTER TABLE IF EXISTS public.reviews
  ALTER COLUMN listing_id DROP NOT NULL;
