/*
  # Fix deals and events RLS for server-side rendering

  1. Changes
    - Drop existing SELECT policies on deals and events that were restricted to authenticated role
    - Recreate them without role restriction so server-rendered pages can access the data
    - Both tables contain public informational content (deals/events visible to all visitors)
    - Conditions still filter: deals must be active, events must be upcoming

  2. Security
    - Deals: only active deals are visible
    - Events: only recent/upcoming events are visible
    - No write access is granted
*/

DROP POLICY IF EXISTS "Authenticated users can read active deals" ON deals;
CREATE POLICY "Anyone can read active deals"
  ON deals FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can read events" ON events;
CREATE POLICY "Anyone can read upcoming events"
  ON events FOR SELECT
  USING (event_date >= now() - interval '1 day');
