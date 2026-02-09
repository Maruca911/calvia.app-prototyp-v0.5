/*
  # Add Phone Number to Profiles

  1. Modified Tables
    - `profiles`
      - `phone_number` (text, optional) - user's phone number for early access contact

  2. Notes
    - Phone number is optional during registration
    - Used for early access notifications when the native app launches
    - GDPR compliant: users explicitly opt in by providing it
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text DEFAULT '';
  END IF;
END $$;
