/*
  # Partner ops automation, invitations, moderation, and finance scaffolding

  This migration is additive and idempotent.
  It extends v0.6 partner capabilities for:
  - verified partners + invitations
  - business-listing mapping automation
  - booking notification/SLA infrastructure
  - review moderation + partner replies
  - attribution and finance statement support
*/

-- ---------------------------------------------------------------------------
-- Partner status fields on businesses
-- ---------------------------------------------------------------------------
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS partner_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS partner_tier text DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS partner_verified_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_partner_status_chk'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_partner_status_chk
      CHECK (partner_status IN ('unverified', 'verified', 'paused'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_partner_tier_chk'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_partner_tier_chk
      CHECK (partner_tier IN ('verified', 'platinum'));
  END IF;
END $$;

UPDATE businesses
SET partner_status = 'verified',
    partner_tier = COALESCE(NULLIF(partner_tier, ''), 'verified'),
    partner_verified_at = COALESCE(partner_verified_at, now())
WHERE lower(name) IN ('the agency', 'rib club', 'just curry')
   OR slug IN ('the-agency', 'rib-club', 'just-curry');

CREATE INDEX IF NOT EXISTS businesses_partner_status_idx
  ON businesses (partner_status, partner_tier);

-- Bootstrap owner memberships for already-claimed businesses.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'business_memberships'
  ) THEN
    INSERT INTO business_memberships (business_id, user_id, role, status)
    SELECT b.id, b.owner_id, 'owner', 'active'
    FROM businesses b
    WHERE b.owner_id IS NOT NULL
    ON CONFLICT (business_id, user_id)
    DO UPDATE SET role = 'owner', status = 'active', updated_at = now();
  END IF;
END $$;

-- Deterministic listing mapping seed for current verified partners.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'business_listing_map'
  ) THEN
    WITH partner_businesses AS (
      SELECT b.id, b.name, b.slug
      FROM businesses b
      WHERE lower(b.name) IN ('the agency', 'rib club', 'just curry')
         OR b.slug IN ('the-agency', 'rib-club', 'just-curry')
    ),
    ranked_candidates AS (
      SELECT
        pb.id AS business_id,
        l.id AS listing_id,
        row_number() OVER (
          PARTITION BY pb.id
          ORDER BY
            CASE WHEN lower(trim(l.name)) = lower(trim(pb.name)) THEN 0 ELSE 1 END,
            l.created_at DESC
        ) AS business_rank
      FROM partner_businesses pb
      JOIN listings l
        ON lower(trim(l.name)) = lower(trim(pb.name))
        OR lower(l.name) LIKE lower('%' || trim(pb.name) || '%')
    ),
    best_per_business AS (
      SELECT business_id, listing_id
      FROM ranked_candidates
      WHERE business_rank = 1
    ),
    unique_candidates AS (
      SELECT
        bpb.business_id,
        bpb.listing_id,
        row_number() OVER (PARTITION BY bpb.listing_id ORDER BY bpb.business_id) AS listing_rank
      FROM best_per_business bpb
    )
    INSERT INTO business_listing_map (business_id, listing_id)
    SELECT uc.business_id, uc.listing_id
    FROM unique_candidates uc
    LEFT JOIN business_listing_map existing
      ON existing.listing_id = uc.listing_id
    WHERE uc.listing_rank = 1
      AND (existing.business_id IS NULL OR existing.business_id = uc.business_id)
    ON CONFLICT (business_id)
    DO UPDATE SET listing_id = EXCLUDED.listing_id, updated_at = now()
    WHERE business_listing_map.listing_id IS DISTINCT FROM EXCLUDED.listing_id;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Common permission helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_can_manage_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM businesses b
      WHERE b.id = p_business_id
        AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM business_memberships bm
      WHERE bm.business_id = p_business_id
        AND bm.user_id = auth.uid()
        AND bm.status = 'active'
        AND bm.role IN ('owner', 'manager')
    );
$$;

REVOKE ALL ON FUNCTION user_can_manage_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_can_manage_business(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Partner invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_role text NOT NULL DEFAULT 'staff' CHECK (invited_role IN ('owner', 'manager', 'staff')),
  invited_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_partner_invitations_unique_pending
    UNIQUE NULLS NOT DISTINCT (business_id, invited_email, status)
);

CREATE INDEX IF NOT EXISTS business_partner_invitations_business_idx
  ON business_partner_invitations (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS business_partner_invitations_email_idx
  ON business_partner_invitations (lower(invited_email), status);

ALTER TABLE business_partner_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_partner_invitations'
      AND policyname = 'Managers can manage partner invitations'
  ) THEN
    CREATE POLICY "Managers can manage partner invitations"
      ON business_partner_invitations
      FOR ALL
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (user_can_manage_business(business_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_partner_invitations'
      AND policyname = 'Invitees can view own invitations'
  ) THEN
    CREATE POLICY "Invitees can view own invitations"
      ON business_partner_invitations
      FOR SELECT
      TO authenticated
      USING (
        lower(invited_email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION touch_business_partner_invitations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_business_partner_invitations_updated_at
  ON business_partner_invitations;

CREATE TRIGGER set_business_partner_invitations_updated_at
  BEFORE UPDATE ON business_partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION touch_business_partner_invitations_updated_at();

CREATE OR REPLACE FUNCTION create_partner_invitation(
  p_business_slug text,
  p_invited_email text,
  p_invited_role text DEFAULT 'staff',
  p_message text DEFAULT ''
)
RETURNS TABLE (invitation_id uuid, invite_token uuid, invitation_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_business_id uuid;
  target_role text;
  created_row business_partner_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  SELECT id
    INTO target_business_id
    FROM businesses
   WHERE slug = p_business_slug
   LIMIT 1;

  IF target_business_id IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF NOT user_can_manage_business(target_business_id) THEN
    RAISE EXCEPTION 'Not authorized for this business'
      USING ERRCODE = '42501';
  END IF;

  IF p_invited_email IS NULL OR trim(p_invited_email) = '' THEN
    RAISE EXCEPTION 'invited_email is required';
  END IF;

  target_role := CASE
    WHEN lower(COALESCE(p_invited_role, '')) IN ('owner', 'manager', 'staff')
      THEN lower(p_invited_role)
    ELSE 'staff'
  END;

  UPDATE business_partner_invitations
     SET status = 'expired',
         updated_at = now()
   WHERE business_id = target_business_id
     AND lower(invited_email) = lower(trim(p_invited_email))
     AND status = 'pending'
     AND expires_at < now();

  INSERT INTO business_partner_invitations (
    business_id,
    invited_email,
    invited_role,
    invited_by_user_id,
    message,
    status
  )
  VALUES (
    target_business_id,
    lower(trim(p_invited_email)),
    target_role,
    auth.uid(),
    COALESCE(p_message, ''),
    'pending'
  )
  RETURNING *
  INTO created_row;

  RETURN QUERY
  SELECT created_row.id, created_row.invite_token, created_row.status;
END;
$$;

REVOKE ALL ON FUNCTION create_partner_invitation(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_partner_invitation(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION accept_business_invitation(p_invite_token uuid)
RETURNS TABLE (business_id uuid, membership_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_row business_partner_invitations%ROWTYPE;
  auth_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  auth_email := lower(COALESCE((auth.jwt() ->> 'email'), ''));
  IF auth_email = '' THEN
    RAISE EXCEPTION 'Authenticated email claim required';
  END IF;

  SELECT *
    INTO invitation_row
    FROM business_partner_invitations
   WHERE invite_token = p_invite_token
   LIMIT 1;

  IF invitation_row.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF invitation_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending';
  END IF;

  IF invitation_row.expires_at < now() THEN
    UPDATE business_partner_invitations
       SET status = 'expired',
           updated_at = now()
     WHERE id = invitation_row.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF lower(invitation_row.invited_email) <> auth_email THEN
    RAISE EXCEPTION 'Invitation email does not match signed-in user'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO business_memberships (business_id, user_id, role, status)
  VALUES (
    invitation_row.business_id,
    auth.uid(),
    invitation_row.invited_role,
    'active'
  )
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();

  UPDATE business_partner_invitations
     SET status = 'accepted',
         accepted_by_user_id = auth.uid(),
         accepted_at = now(),
         updated_at = now()
   WHERE id = invitation_row.id;

  RETURN QUERY
  SELECT invitation_row.business_id, invitation_row.invited_role;
END;
$$;

REVOKE ALL ON FUNCTION accept_business_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_business_invitation(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Bookings attribution + SLA timestamps
-- ---------------------------------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source_channel text DEFAULT 'app',
  ADD COLUMN IF NOT EXISTS campaign_source text DEFAULT '',
  ADD COLUMN IF NOT EXISTS attributed_content text DEFAULT '',
  ADD COLUMN IF NOT EXISTS response_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

UPDATE bookings
SET response_due_at = COALESCE(response_due_at, created_at + interval '15 minutes')
WHERE status = 'requested' AND response_due_at IS NULL;

CREATE INDEX IF NOT EXISTS bookings_source_channel_idx
  ON bookings (source_channel, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_response_due_idx
  ON bookings (response_due_at, status);

-- ---------------------------------------------------------------------------
-- Notifications, SLA alerts, and spend entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('consumer', 'partner', 'support')),
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'in_app')),
  recipient text NOT NULL DEFAULT '',
  template_key text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  send_after timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_notification_queue_status_idx
  ON booking_notification_queue (status, send_after);

CREATE INDEX IF NOT EXISTS booking_notification_queue_business_idx
  ON booking_notification_queue (business_id, created_at DESC);

ALTER TABLE booking_notification_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_notification_queue'
      AND policyname = 'Managers can view booking notifications'
  ) THEN
    CREATE POLICY "Managers can view booking notifications"
      ON booking_notification_queue
      FOR SELECT
      TO authenticated
      USING (business_id IS NOT NULL AND user_can_manage_business(business_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_notification_queue'
      AND policyname = 'Managers can update booking notifications'
  ) THEN
    CREATE POLICY "Managers can update booking notifications"
      ON booking_notification_queue
      FOR UPDATE
      TO authenticated
      USING (business_id IS NOT NULL AND user_can_manage_business(business_id))
      WITH CHECK (business_id IS NOT NULL AND user_can_manage_business(business_id));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_sla_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'response_time' CHECK (alert_type IN ('response_time', 'no_show', 'dispute')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL DEFAULT '',
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS booking_sla_alerts_open_idx
  ON booking_sla_alerts (business_id, status, due_at);

ALTER TABLE booking_sla_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_sla_alerts'
      AND policyname = 'Managers can view SLA alerts'
  ) THEN
    CREATE POLICY "Managers can view SLA alerts"
      ON booking_sla_alerts
      FOR SELECT
      TO authenticated
      USING (user_can_manage_business(business_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_sla_alerts'
      AND policyname = 'Managers can update SLA alerts'
  ) THEN
    CREATE POLICY "Managers can update SLA alerts"
      ON booking_sla_alerts
      FOR UPDATE
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (user_can_manage_business(business_id));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_type text NOT NULL DEFAULT 'no_show' CHECK (dispute_type IN ('no_show', 'deposit', 'charge', 'other')),
  description text NOT NULL DEFAULT '',
  requested_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (requested_amount >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS booking_disputes_business_idx
  ON booking_disputes (business_id, status, created_at DESC);

ALTER TABLE booking_disputes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_disputes'
      AND policyname = 'Managers can manage booking disputes'
  ) THEN
    CREATE POLICY "Managers can manage booking disputes"
      ON booking_disputes
      FOR ALL
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (
        user_can_manage_business(business_id)
        AND created_by_user_id = auth.uid()
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_spend_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  entry_source text NOT NULL DEFAULT 'manual' CHECK (entry_source IN ('manual', 'pos_sync')),
  entered_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_spend_entries_booking_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS booking_spend_entries_business_idx
  ON booking_spend_entries (business_id, created_at DESC);

ALTER TABLE booking_spend_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_spend_entries'
      AND policyname = 'Managers can view spend entries'
  ) THEN
    CREATE POLICY "Managers can view spend entries"
      ON booking_spend_entries
      FOR SELECT
      TO authenticated
      USING (user_can_manage_business(business_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'booking_spend_entries'
      AND policyname = 'Managers can write spend entries'
  ) THEN
    CREATE POLICY "Managers can write spend entries"
      ON booking_spend_entries
      FOR ALL
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (
        user_can_manage_business(business_id)
        AND entered_by_user_id = auth.uid()
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION touch_booking_related_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_notification_queue_updated_at
  ON booking_notification_queue;
CREATE TRIGGER set_booking_notification_queue_updated_at
  BEFORE UPDATE ON booking_notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION touch_booking_related_updated_at();

DROP TRIGGER IF EXISTS set_booking_spend_entries_updated_at
  ON booking_spend_entries;
CREATE TRIGGER set_booking_spend_entries_updated_at
  BEFORE UPDATE ON booking_spend_entries
  FOR EACH ROW
  EXECUTE FUNCTION touch_booking_related_updated_at();

DROP TRIGGER IF EXISTS set_booking_disputes_updated_at
  ON booking_disputes;
CREATE TRIGGER set_booking_disputes_updated_at
  BEFORE UPDATE ON booking_disputes
  FOR EACH ROW
  EXECUTE FUNCTION touch_booking_related_updated_at();

-- ---------------------------------------------------------------------------
-- Review moderation and replies
-- ---------------------------------------------------------------------------
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS moderation_reason text DEFAULT '',
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_moderation_status_chk'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_moderation_status_chk
      CHECK (moderation_status IN ('visible', 'flagged', 'hidden'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  responder_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_replies_business_idx
  ON review_replies (business_id, created_at DESC);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_replies'
      AND policyname = 'Public can read published review replies'
  ) THEN
    CREATE POLICY "Public can read published review replies"
      ON review_replies
      FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_replies'
      AND policyname = 'Managers can manage review replies'
  ) THEN
    CREATE POLICY "Managers can manage review replies"
      ON review_replies
      FOR ALL
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (
        user_can_manage_business(business_id)
        AND responder_user_id = auth.uid()
      );
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_review_replies_updated_at
  ON review_replies;
CREATE TRIGGER set_review_replies_updated_at
  BEFORE UPDATE ON review_replies
  FOR EACH ROW
  EXECUTE FUNCTION touch_booking_related_updated_at();

CREATE OR REPLACE FUNCTION resolve_business_id_for_review(p_review_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(r.business_id, blm.business_id)
  FROM reviews r
  LEFT JOIN business_listing_map blm
    ON blm.listing_id = r.listing_id
  WHERE r.id = p_review_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION resolve_business_id_for_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_business_id_for_review(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION moderate_review_for_partner(
  p_review_id uuid,
  p_moderation_status text,
  p_moderation_reason text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_business_id uuid;
  normalized_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  target_business_id := resolve_business_id_for_review(p_review_id);
  IF target_business_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF NOT user_can_manage_business(target_business_id) THEN
    RAISE EXCEPTION 'Not authorized for this review'
      USING ERRCODE = '42501';
  END IF;

  normalized_status := CASE
    WHEN lower(COALESCE(p_moderation_status, '')) IN ('visible', 'flagged', 'hidden')
      THEN lower(p_moderation_status)
    ELSE 'visible'
  END;

  UPDATE reviews
     SET moderation_status = normalized_status,
         moderation_reason = COALESCE(p_moderation_reason, ''),
         moderated_by = auth.uid(),
         moderated_at = now()
   WHERE id = p_review_id;
END;
$$;

REVOKE ALL ON FUNCTION moderate_review_for_partner(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION moderate_review_for_partner(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION upsert_review_reply_for_partner(
  p_review_id uuid,
  p_response_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_business_id uuid;
  resulting_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  target_business_id := resolve_business_id_for_review(p_review_id);
  IF target_business_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF NOT user_can_manage_business(target_business_id) THEN
    RAISE EXCEPTION 'Not authorized for this review'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO review_replies (
    review_id,
    business_id,
    responder_user_id,
    response_text,
    status
  )
  VALUES (
    p_review_id,
    target_business_id,
    auth.uid(),
    COALESCE(p_response_text, ''),
    'published'
  )
  ON CONFLICT (review_id)
  DO UPDATE SET
    response_text = EXCLUDED.response_text,
    responder_user_id = EXCLUDED.responder_user_id,
    status = 'published',
    updated_at = now()
  RETURNING id INTO resulting_id;

  RETURN resulting_id;
END;
$$;

REVOKE ALL ON FUNCTION upsert_review_reply_for_partner(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_review_reply_for_partner(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Mapping automation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_business_listing_map(p_business_slug text)
RETURNS TABLE (business_id uuid, listing_id uuid, was_created boolean, match_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_business businesses%ROWTYPE;
  existing_listing_id uuid;
  candidate_listing_id uuid;
  fallback_category_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
    INTO target_business
    FROM businesses
   WHERE slug = p_business_slug
   LIMIT 1;

  IF target_business.id IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF NOT user_can_manage_business(target_business.id) THEN
    RAISE EXCEPTION 'Not authorized for this business'
      USING ERRCODE = '42501';
  END IF;

  SELECT blm.listing_id
    INTO existing_listing_id
    FROM business_listing_map blm
   WHERE blm.business_id = target_business.id
   LIMIT 1;

  IF existing_listing_id IS NOT NULL THEN
    RETURN QUERY
    SELECT target_business.id, existing_listing_id, false, 'existing';
    RETURN;
  END IF;

  SELECT l.id
    INTO candidate_listing_id
    FROM listings l
   WHERE lower(trim(l.name)) = lower(trim(target_business.name))
   ORDER BY l.created_at DESC
   LIMIT 1;

  IF candidate_listing_id IS NULL THEN
    SELECT l.id
      INTO candidate_listing_id
      FROM listings l
     WHERE lower(l.name) LIKE lower('%' || trim(target_business.name) || '%')
     ORDER BY l.created_at DESC
     LIMIT 1;
  END IF;

  IF candidate_listing_id IS NULL THEN
    fallback_category_id := target_business.category_id;
    IF fallback_category_id IS NULL THEN
      SELECT c.id
        INTO fallback_category_id
        FROM categories c
       ORDER BY c.sort_order ASC NULLS LAST, c.created_at ASC
       LIMIT 1;
    END IF;

    IF fallback_category_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create listing without category';
    END IF;

    INSERT INTO listings (
      category_id,
      name,
      description,
      contact_phone,
      contact_email,
      website_url,
      address,
      neighborhood,
      social_media,
      image_url,
      tags,
      is_featured
    )
    VALUES (
      fallback_category_id,
      target_business.name,
      COALESCE(target_business.description, ''),
      COALESCE(target_business.phone, ''),
      COALESCE(target_business.email, ''),
      COALESCE(target_business.website, ''),
      COALESCE(target_business.address, ''),
      COALESCE((SELECT name FROM areas WHERE id = target_business.area_id), 'Calvia'),
      COALESCE(target_business.social_links, '{}'::jsonb),
      COALESCE(target_business.image_url, ''),
      ARRAY['synced-from-businesses']::text[],
      false
    )
    RETURNING id INTO candidate_listing_id;

    INSERT INTO business_listing_map (business_id, listing_id)
    VALUES (target_business.id, candidate_listing_id)
    ON CONFLICT (business_id)
    DO UPDATE SET listing_id = EXCLUDED.listing_id, updated_at = now();

    RETURN QUERY
    SELECT target_business.id, candidate_listing_id, true, 'created';
    RETURN;
  END IF;

  INSERT INTO business_listing_map (business_id, listing_id)
  VALUES (target_business.id, candidate_listing_id)
  ON CONFLICT (business_id)
  DO UPDATE SET listing_id = EXCLUDED.listing_id, updated_at = now();

  RETURN QUERY
  SELECT target_business.id, candidate_listing_id, false, 'matched';
END;
$$;

REVOKE ALL ON FUNCTION ensure_business_listing_map(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_business_listing_map(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Booking notification + SLA trigger logic
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_booking_response_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'requested' AND NEW.response_due_at IS NULL THEN
    NEW.response_due_at := COALESCE(NEW.created_at, now()) + interval '15 minutes';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'requested'
     AND NEW.status <> 'requested'
     AND NEW.responded_at IS NULL THEN
    NEW.responded_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_response_timestamps ON bookings;
CREATE TRIGGER trg_set_booking_response_timestamps
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_response_timestamps();

CREATE OR REPLACE FUNCTION queue_booking_notifications_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapped_business_id uuid;
  consumer_email text := '';
  partner_email text := '';
BEGIN
  IF NEW.listing_id IS NOT NULL THEN
    SELECT blm.business_id
      INTO mapped_business_id
      FROM business_listing_map blm
     WHERE blm.listing_id = NEW.listing_id
     LIMIT 1;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    SELECT u.email
      INTO consumer_email
      FROM auth.users u
     WHERE u.id = NEW.user_id
     LIMIT 1;
  END IF;

  IF mapped_business_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(b.email, ''), NULLIF(b.website, ''), '')
      INTO partner_email
      FROM businesses b
     WHERE b.id = mapped_business_id
     LIMIT 1;
  END IF;

  INSERT INTO booking_notification_queue (
    booking_id,
    business_id,
    recipient_type,
    channel,
    recipient,
    template_key,
    payload
  )
  VALUES
    (
      NEW.id,
      mapped_business_id,
      'consumer',
      'in_app',
      COALESCE(consumer_email, ''),
      'booking_requested_consumer',
      jsonb_build_object(
        'booking_id', NEW.id,
        'business_name', NEW.business_name,
        'status', NEW.status
      )
    ),
    (
      NEW.id,
      mapped_business_id,
      'partner',
      'email',
      COALESCE(partner_email, ''),
      'booking_requested_partner',
      jsonb_build_object(
        'booking_id', NEW.id,
        'business_name', NEW.business_name,
        'service_type', NEW.service_type,
        'booking_date', NEW.booking_date,
        'booking_time', NEW.booking_time,
        'party_size', NEW.party_size
      )
    ),
    (
      NEW.id,
      mapped_business_id,
      'support',
      'whatsapp',
      '',
      'booking_requested_support',
      jsonb_build_object(
        'booking_id', NEW.id,
        'business_name', NEW.business_name,
        'service_type', NEW.service_type
      )
    );

  IF mapped_business_id IS NOT NULL THEN
    INSERT INTO booking_sla_alerts (
      booking_id,
      business_id,
      alert_type,
      severity,
      message,
      due_at,
      status,
      metadata
    )
    VALUES (
      NEW.id,
      mapped_business_id,
      'response_time',
      'medium',
      'Booking request awaiting partner response',
      NEW.response_due_at,
      'open',
      jsonb_build_object(
        'booking_status', NEW.status,
        'source_channel', NEW.source_channel
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_booking_notifications_on_insert ON bookings;
CREATE TRIGGER trg_queue_booking_notifications_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION queue_booking_notifications_on_insert();

CREATE OR REPLACE FUNCTION sync_booking_alert_state_after_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> 'requested' THEN
    UPDATE booking_sla_alerts
       SET status = 'resolved',
           resolved_at = now()
     WHERE booking_id = NEW.id
       AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_booking_alert_state_after_update ON bookings;
CREATE TRIGGER trg_sync_booking_alert_state_after_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_alert_state_after_update();

CREATE OR REPLACE FUNCTION refresh_booking_sla_alerts(p_business_slug text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  open_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required'
      USING ERRCODE = '42501';
  END IF;

  WITH managed AS (
    SELECT b.id AS business_id
    FROM businesses b
    WHERE (p_business_slug IS NULL OR b.slug = p_business_slug)
      AND user_can_manage_business(b.id)
  ),
  managed_listings AS (
    SELECT blm.listing_id, blm.business_id
    FROM business_listing_map blm
    JOIN managed m
      ON m.business_id = blm.business_id
  )
  UPDATE bookings b
     SET response_due_at = COALESCE(b.response_due_at, b.created_at + interval '15 minutes')
    FROM managed_listings ml
   WHERE b.listing_id = ml.listing_id
     AND b.status = 'requested'
     AND b.response_due_at IS NULL;

  WITH managed AS (
    SELECT b.id AS business_id
    FROM businesses b
    WHERE (p_business_slug IS NULL OR b.slug = p_business_slug)
      AND user_can_manage_business(b.id)
  ),
  managed_listings AS (
    SELECT blm.listing_id, blm.business_id
    FROM business_listing_map blm
    JOIN managed m
      ON m.business_id = blm.business_id
  ),
  overdue AS (
    SELECT bk.id AS booking_id,
           ml.business_id,
           bk.response_due_at
    FROM bookings bk
    JOIN managed_listings ml
      ON ml.listing_id = bk.listing_id
    WHERE bk.status = 'requested'
      AND bk.response_due_at IS NOT NULL
      AND bk.response_due_at < now()
  )
  INSERT INTO booking_sla_alerts (
    booking_id,
    business_id,
    alert_type,
    severity,
    message,
    due_at,
    status,
    metadata
  )
  SELECT
    o.booking_id,
    o.business_id,
    'response_time',
    'high',
    'Booking response SLA breached',
    o.response_due_at,
    'open',
    jsonb_build_object('breach_detected_at', now())
  FROM overdue o
  WHERE NOT EXISTS (
    SELECT 1
    FROM booking_sla_alerts a
    WHERE a.booking_id = o.booking_id
      AND a.alert_type = 'response_time'
      AND a.status = 'open'
  );

  WITH managed AS (
    SELECT b.id AS business_id
    FROM businesses b
    WHERE (p_business_slug IS NULL OR b.slug = p_business_slug)
      AND user_can_manage_business(b.id)
  ),
  managed_listings AS (
    SELECT blm.listing_id, blm.business_id
    FROM business_listing_map blm
    JOIN managed m
      ON m.business_id = blm.business_id
  )
  UPDATE booking_sla_alerts a
     SET status = 'resolved',
         resolved_at = COALESCE(a.resolved_at, now())
    FROM bookings bk
    JOIN managed_listings ml
      ON ml.listing_id = bk.listing_id
   WHERE a.booking_id = bk.id
     AND a.business_id = ml.business_id
     AND a.status = 'open'
     AND bk.status <> 'requested';

  WITH managed AS (
    SELECT b.id AS business_id
    FROM businesses b
    WHERE (p_business_slug IS NULL OR b.slug = p_business_slug)
      AND user_can_manage_business(b.id)
  )
  SELECT count(*)
    INTO open_count
    FROM booking_sla_alerts a
    JOIN managed m
      ON m.business_id = a.business_id
   WHERE a.status = 'open';

  RETURN COALESCE(open_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION refresh_booking_sla_alerts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_booking_sla_alerts(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Finance statement snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_reconciliation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  billing_month date NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_reconciliation_snapshots_unique
    UNIQUE (business_id, billing_month)
);

CREATE INDEX IF NOT EXISTS partner_reconciliation_snapshots_business_idx
  ON partner_reconciliation_snapshots (business_id, billing_month DESC);

ALTER TABLE partner_reconciliation_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_reconciliation_snapshots'
      AND policyname = 'Managers can manage reconciliation snapshots'
  ) THEN
    CREATE POLICY "Managers can manage reconciliation snapshots"
      ON partner_reconciliation_snapshots
      FOR ALL
      TO authenticated
      USING (user_can_manage_business(business_id))
      WITH CHECK (
        user_can_manage_business(business_id)
        AND created_by_user_id = auth.uid()
      );
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_partner_reconciliation_snapshots_updated_at
  ON partner_reconciliation_snapshots;
CREATE TRIGGER set_partner_reconciliation_snapshots_updated_at
  BEFORE UPDATE ON partner_reconciliation_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION touch_booking_related_updated_at();
