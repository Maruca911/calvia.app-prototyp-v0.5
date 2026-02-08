/*
  # Auto-confirm email for prototype

  1. Changes
    - Creates a trigger that auto-confirms email addresses on signup
    - This bypasses the email confirmation requirement for the prototype phase
    - Should be removed for production when proper email verification is needed

  2. Important Notes
    - This is a prototype-only configuration
    - For production, remove this trigger and enable email confirmation in Supabase Dashboard
*/

CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER confirm_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_email();
