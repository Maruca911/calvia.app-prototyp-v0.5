/*
  # Fix reviews SELECT policy

  1. Changes
    - Allow all users (including anonymous/non-logged-in) to read reviews
    - Reviews are public content that help visitors evaluate businesses
    - Write policies remain restricted to authenticated users

  2. Security
    - Only SELECT is affected; INSERT/UPDATE/DELETE still require auth.uid() match
*/

DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (listing_id IS NOT NULL);
