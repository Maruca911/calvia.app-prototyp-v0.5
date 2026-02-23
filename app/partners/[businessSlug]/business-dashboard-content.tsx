'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeEuro,
  Clock3,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  UserPlus2,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { buildBookingSupportMessage, buildSupportWhatsAppUrl } from '@/lib/support';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'completed';
type PartnerRole = 'owner' | 'manager' | 'staff';
type ReviewModerationStatus = 'visible' | 'flagged' | 'hidden';

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
} | null;

interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  owner_id: string | null;
  claimed: boolean;
  view_count: number | null;
  category_id: string | null;
  area_id: string | null;
  partner_status?: 'unverified' | 'verified' | 'paused';
  partner_tier?: 'verified' | 'platinum';
}

interface MembershipRecord {
  role: PartnerRole;
  status: 'active' | 'invited' | 'disabled';
}

interface BookingRecord {
  id: string;
  business_name: string;
  service_type: string;
  booking_date: string | null;
  booking_time: string | null;
  party_size: number;
  status: BookingStatus;
  created_at: string;
  user_id: string;
}

interface ReviewRecord {
  id: string;
  rating: number;
  title: string;
  content: string;
  comment: string;
  created_at: string;
  user_id: string;
}

interface InvitationRecord {
  id: string;
  invited_email: string;
  invited_role: PartnerRole;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  created_at: string;
  expires_at: string;
  invite_token: string;
}

interface NotificationRecord {
  id: string;
  booking_id: string;
  recipient_type: 'consumer' | 'partner' | 'support';
  channel: 'email' | 'whatsapp' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  template_key: string;
  recipient: string;
  created_at: string;
}

interface SlaAlertRecord {
  id: string;
  booking_id: string;
  alert_type: 'response_time' | 'no_show' | 'dispute';
  severity: 'low' | 'medium' | 'high';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  due_at: string | null;
  created_at: string;
}

interface BookingDisputeRecord {
  id: string;
  booking_id: string;
  dispute_type: 'no_show' | 'deposit' | 'charge' | 'other';
  description: string;
  requested_amount: number;
  currency: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  created_at: string;
}

interface SpendEntryRecord {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  entry_source: 'manual' | 'pos_sync';
  created_at: string;
}

interface ReconciliationSnapshotRecord {
  id: string;
  billing_month: string;
  currency: string;
  totals: {
    bookings?: number;
    gross_spend?: number;
    commission_due?: number;
  };
  created_at: string;
}

interface ReviewReplyRecord {
  id: string;
  review_id: string;
  response_text: string;
  updated_at: string;
}

interface BookingAttributionRecord {
  id: string;
  source_channel: string;
  campaign_source: string;
  attributed_content: string;
  status: BookingStatus;
  created_at: string;
  response_due_at: string | null;
  responded_at: string | null;
}

function bookingStatusClass(status: BookingStatus): string {
  if (status === 'confirmed') return 'bg-sage-100 text-sage-700';
  if (status === 'declined') return 'bg-red-100 text-red-700';
  if (status === 'completed') return 'bg-ocean-100 text-ocean-700';
  return 'bg-cream-200 text-foreground';
}

function reviewStatusClass(status: ReviewModerationStatus): string {
  if (status === 'hidden') return 'bg-red-100 text-red-700';
  if (status === 'flagged') return 'bg-amber-100 text-amber-700';
  return 'bg-sage-100 text-sage-700';
}

function formatDate(dateIso: string | null): string {
  if (!dateIso) return 'Flexible date';
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return 'Flexible date';
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateIso: string | null): string {
  if (!dateIso) return 'Not set';
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obfuscateUser(userId: string): string {
  return `Member ${userId.slice(0, 8)}`;
}

function normalizeUrl(input: string): string {
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

function isOptionalFeatureError(error: SupabaseErrorLike): boolean {
  if (!error) {
    return false;
  }
  if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42703') {
    return true;
  }
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  );
}

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}

function toMonthInputValue(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function BusinessDashboardContent({ businessSlug }: { businessSlug: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [membershipRole, setMembershipRole] = useState<PartnerRole | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [mappedListingId, setMappedListingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewModerationById, setReviewModerationById] = useState<Record<string, ReviewModerationStatus>>({});
  const [reviewRepliesById, setReviewRepliesById] = useState<Record<string, ReviewReplyRecord>>({});
  const [reviewReplyDrafts, setReviewReplyDrafts] = useState<Record<string, string>>({});
  const [bookingUpdateId, setBookingUpdateId] = useState<string | null>(null);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<PartnerRole>('manager');
  const [inviteMessage, setInviteMessage] = useState('');
  const [latestInviteUrl, setLatestInviteUrl] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [mappingSyncing, setMappingSyncing] = useState(false);

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationUpdateId, setNotificationUpdateId] = useState<string | null>(null);
  const [slaAlerts, setSlaAlerts] = useState<SlaAlertRecord[]>([]);
  const [slaUpdateId, setSlaUpdateId] = useState<string | null>(null);
  const [slaRefreshing, setSlaRefreshing] = useState(false);
  const [disputes, setDisputes] = useState<BookingDisputeRecord[]>([]);
  const [disputeBookingId, setDisputeBookingId] = useState('');
  const [disputeType, setDisputeType] = useState<BookingDisputeRecord['dispute_type']>('no_show');
  const [disputeAmount, setDisputeAmount] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeSaving, setDisputeSaving] = useState(false);
  const [disputeUpdateId, setDisputeUpdateId] = useState<string | null>(null);

  const [spendEntries, setSpendEntries] = useState<SpendEntryRecord[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [savingSpend, setSavingSpend] = useState(false);

  const [snapshots, setSnapshots] = useState<ReconciliationSnapshotRecord[]>([]);
  const [snapshotMonth, setSnapshotMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [snapshotSaving, setSnapshotSaving] = useState(false);

  const [attributionRows, setAttributionRows] = useState<BookingAttributionRecord[]>([]);
  const [moduleWarnings, setModuleWarnings] = useState<string[]>([]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    return (reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const pendingBookings = useMemo(
    () => bookings.filter((item) => item.status === 'requested').length,
    [bookings]
  );

  const canManageTeam = membershipRole === 'owner' || membershipRole === 'manager';

  const attributionSummary = useMemo(() => {
    const summary = new Map<
      string,
      { source: string; bookings: number; confirmed: number; completed: number }
    >();

    for (const row of attributionRows) {
      const source =
        row.campaign_source.trim() || row.source_channel.trim() || 'app';
      const existing =
        summary.get(source) || { source, bookings: 0, confirmed: 0, completed: 0 };
      existing.bookings += 1;
      if (row.status === 'confirmed') {
        existing.confirmed += 1;
      }
      if (row.status === 'completed') {
        existing.completed += 1;
      }
      summary.set(source, existing);
    }

    return Array.from(summary.values()).sort((a, b) => b.bookings - a.bookings);
  }, [attributionRows]);

  const slaMetrics = useMemo(() => {
    const responseMinutes: number[] = [];
    let overdueCount = 0;

    for (const row of attributionRows) {
      if (row.status === 'requested' && row.response_due_at) {
        const dueAt = new Date(row.response_due_at).getTime();
        if (!Number.isNaN(dueAt) && dueAt < Date.now()) {
          overdueCount += 1;
        }
      }

      if (row.responded_at) {
        const createdAt = new Date(row.created_at).getTime();
        const respondedAt = new Date(row.responded_at).getTime();
        if (!Number.isNaN(createdAt) && !Number.isNaN(respondedAt) && respondedAt >= createdAt) {
          responseMinutes.push(Math.round((respondedAt - createdAt) / 60000));
        }
      }
    }

    const averageResponseMinutes =
      responseMinutes.length > 0
        ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length)
        : null;

    return { overdueCount, averageResponseMinutes };
  }, [attributionRows]);

  const totalTrackedSpend = useMemo(
    () => spendEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    [spendEntries]
  );

  const addModuleWarning = useCallback((message: string) => {
    setModuleWarnings((previous) => {
      if (previous.includes(message)) {
        return previous;
      }
      return [...previous, message];
    });
  }, []);

  const loadPartnerOps = useCallback(
    async (businessId: string, listingId: string | null, fallbackBookings: BookingRecord[]) => {
      setOpsLoading(true);
      setModuleWarnings([]);

      const supabase = getSupabase();

      const [
        invitationResult,
        notificationResult,
        slaResult,
        disputeResult,
        spendResult,
        snapshotResult,
        replyResult,
        reviewModerationResult,
        attributionResult,
      ] = await Promise.all([
        supabase
          .from('business_partner_invitations')
          .select('id, invited_email, invited_role, status, created_at, expires_at, invite_token')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('booking_notification_queue')
          .select('id, booking_id, recipient_type, channel, status, template_key, recipient, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('booking_sla_alerts')
          .select('id, booking_id, alert_type, severity, message, status, due_at, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('booking_disputes')
          .select(
            'id, booking_id, dispute_type, description, requested_amount, currency, status, created_at'
          )
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('booking_spend_entries')
          .select('id, booking_id, amount, currency, entry_source, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('partner_reconciliation_snapshots')
          .select('id, billing_month, currency, totals, created_at')
          .eq('business_id', businessId)
          .order('billing_month', { ascending: false })
          .limit(12),
        supabase
          .from('review_replies')
          .select('id, review_id, response_text, updated_at')
          .eq('business_id', businessId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('id, moderation_status')
          .eq('business_id', businessId)
          .limit(100),
        listingId
          ? supabase
              .from('bookings')
              .select(
                'id, source_channel, campaign_source, attributed_content, status, created_at, response_due_at, responded_at'
              )
              .eq('listing_id', listingId)
              .order('created_at', { ascending: false })
              .limit(400)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (invitationResult.error) {
        if (isOptionalFeatureError(invitationResult.error)) {
          addModuleWarning('Partner invitations will activate after the latest DB migration is applied.');
          setInvitations([]);
        } else {
          console.error('[PartnerBusiness] Failed loading invitations', invitationResult.error);
        }
      } else {
        setInvitations((invitationResult.data || []) as InvitationRecord[]);
      }

      if (notificationResult.error) {
        if (isOptionalFeatureError(notificationResult.error)) {
          addModuleWarning('Notification queue is pending migration in this environment.');
          setNotifications([]);
        } else {
          console.error('[PartnerBusiness] Failed loading notifications', notificationResult.error);
        }
      } else {
        setNotifications((notificationResult.data || []) as NotificationRecord[]);
      }

      if (slaResult.error) {
        if (isOptionalFeatureError(slaResult.error)) {
          addModuleWarning('SLA alerts are pending migration in this environment.');
          setSlaAlerts([]);
        } else {
          console.error('[PartnerBusiness] Failed loading SLA alerts', slaResult.error);
        }
      } else {
        setSlaAlerts((slaResult.data || []) as SlaAlertRecord[]);
      }

      if (disputeResult.error) {
        if (isOptionalFeatureError(disputeResult.error)) {
          addModuleWarning('Dispute workflow is pending migration in this environment.');
          setDisputes([]);
        } else {
          console.error('[PartnerBusiness] Failed loading disputes', disputeResult.error);
        }
      } else {
        setDisputes((disputeResult.data || []) as BookingDisputeRecord[]);
      }

      if (spendResult.error) {
        if (isOptionalFeatureError(spendResult.error)) {
          addModuleWarning('Spend tracking is pending migration in this environment.');
          setSpendEntries([]);
        } else {
          console.error('[PartnerBusiness] Failed loading spend entries', spendResult.error);
        }
      } else {
        setSpendEntries((spendResult.data || []) as SpendEntryRecord[]);
      }

      if (snapshotResult.error) {
        if (isOptionalFeatureError(snapshotResult.error)) {
          addModuleWarning('Reconciliation snapshots are pending migration in this environment.');
          setSnapshots([]);
        } else {
          console.error('[PartnerBusiness] Failed loading reconciliation snapshots', snapshotResult.error);
        }
      } else {
        setSnapshots((snapshotResult.data || []) as ReconciliationSnapshotRecord[]);
      }

      if (replyResult.error) {
        if (isOptionalFeatureError(replyResult.error)) {
          addModuleWarning('Review replies are pending migration in this environment.');
          setReviewRepliesById({});
        } else {
          console.error('[PartnerBusiness] Failed loading review replies', replyResult.error);
        }
      } else {
        const replyMap: Record<string, ReviewReplyRecord> = {};
        for (const row of (replyResult.data || []) as ReviewReplyRecord[]) {
          replyMap[row.review_id] = row;
        }
        setReviewRepliesById(replyMap);
        setReviewReplyDrafts((previous) => {
          const next = { ...previous };
          for (const row of Object.values(replyMap)) {
            if (!next[row.review_id]) {
              next[row.review_id] = row.response_text || '';
            }
          }
          return next;
        });
      }

      if (reviewModerationResult.error) {
        if (isOptionalFeatureError(reviewModerationResult.error)) {
          addModuleWarning('Review moderation controls are pending migration in this environment.');
        } else {
          console.error('[PartnerBusiness] Failed loading review moderation state', reviewModerationResult.error);
        }
      } else {
        const moderationMap: Record<string, ReviewModerationStatus> = {};
        for (const row of (reviewModerationResult.data || []) as Array<{
          id: string;
          moderation_status?: string;
        }>) {
          const status = row.moderation_status;
          moderationMap[row.id] =
            status === 'flagged' || status === 'hidden' ? status : 'visible';
        }
        setReviewModerationById(moderationMap);
      }

      if (attributionResult.error) {
        if (isOptionalFeatureError(attributionResult.error)) {
          addModuleWarning('Campaign attribution columns are pending migration in this environment.');
        } else {
          console.error('[PartnerBusiness] Failed loading attribution rows', attributionResult.error);
        }

        setAttributionRows(
          fallbackBookings.map((row) => ({
            id: row.id,
            source_channel: 'app',
            campaign_source: '',
            attributed_content: '',
            status: row.status,
            created_at: row.created_at,
            response_due_at: null,
            responded_at: null,
          }))
        );
      } else {
        setAttributionRows((attributionResult.data || []) as BookingAttributionRecord[]);
      }

      setOpsLoading(false);
    },
    [addModuleWarning]
  );

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, address, phone, email, website, owner_id, claimed, view_count, category_id, area_id, partner_status, partner_tier'
        )
        .eq('slug', businessSlug)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!businessData) {
        setError('Business not found.');
        setLoading(false);
        return;
      }

      const businessRecord = businessData as BusinessRecord;
      setBusiness(businessRecord);

      const isOwner = businessRecord.owner_id === user.id;
      let role: PartnerRole | null = isOwner ? 'owner' : null;

      if (!isOwner) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('business_memberships')
          .select('role, status')
          .eq('business_id', businessRecord.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membershipError) {
          throw new Error(membershipError.message);
        }

        if (!membershipData) {
          setError('You do not have access to this business dashboard.');
          setLoading(false);
          return;
        }

        role = (membershipData as MembershipRecord).role;
      }

      setMembershipRole(role);

      const [
        { data: categoryData },
        { data: areaData },
        { data: listingMapData },
        { data: reviewData, error: reviewError },
      ] = await Promise.all([
        businessRecord.category_id
          ? supabase.from('categories').select('name').eq('id', businessRecord.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        businessRecord.area_id
          ? supabase.from('areas').select('name').eq('id', businessRecord.area_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('business_listing_map')
          .select('listing_id')
          .eq('business_id', businessRecord.id)
          .maybeSingle(),
        supabase
          .from('reviews')
          .select('id, rating, title, content, comment, created_at, user_id')
          .eq('business_id', businessRecord.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setCategoryName((categoryData as { name?: string } | null)?.name || '');
      setAreaName((areaData as { name?: string } | null)?.name || '');

      const listingId = (listingMapData as { listing_id?: string } | null)?.listing_id || null;
      setMappedListingId(listingId);

      if (reviewError) {
        throw new Error(reviewError.message);
      }
      setReviews((reviewData || []) as ReviewRecord[]);

      let bookingRows: BookingRecord[] = [];

      if (listingId) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(
            'id, business_name, service_type, booking_date, booking_time, party_size, status, created_at, user_id'
          )
          .eq('listing_id', listingId)
          .order('created_at', { ascending: false })
          .limit(80);

        if (bookingError) {
          throw new Error(bookingError.message);
        }

        bookingRows = (bookingData || []) as BookingRecord[];
        setBookings(bookingRows);
      } else {
        setBookings([]);
      }

      await loadPartnerOps(businessRecord.id, listingId, bookingRows);
    } catch (loadError) {
      console.error('[PartnerBusiness] Failed loading dashboard', loadError);
      const message = loadError instanceof Error ? loadError.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, loadPartnerOps, user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookingUpdateId(bookingId);
    try {
      const { error: updateError } = await getSupabase()
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setBookings((previous) =>
        previous.map((item) => (item.id === bookingId ? { ...item, status } : item))
      );

      setAttributionRows((previous) =>
        previous.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                status,
                responded_at:
                  status === 'requested'
                    ? item.responded_at
                    : item.responded_at || new Date().toISOString(),
              }
            : item
        )
      );

      toast.success(`Booking marked as ${status}.`);
    } catch (updateError) {
      console.error('[PartnerBusiness] Failed to update booking status', updateError);
      toast.error(friendlyError(updateError));
    } finally {
      setBookingUpdateId(null);
    }
  };

  const syncBusinessListingMap = async () => {
    if (!business || !canManageTeam) {
      toast.error('Only owner or manager can run listing mapping.');
      return;
    }

    setMappingSyncing(true);
    try {
      const { data, error: rpcError } = await getSupabase().rpc('ensure_business_listing_map', {
        p_business_slug: business.slug,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        | { listing_id?: string; match_type?: string }
        | null;
      const listingId = row?.listing_id || null;

      if (listingId) {
        setMappedListingId(listingId);
      }

      toast.success(
        listingId
          ? `Listing mapping synced (${row?.match_type || 'ok'}).`
          : 'Mapping completed, but no listing could be linked yet.'
      );

      await loadDashboard();
    } catch (error) {
      console.error('[PartnerBusiness] Failed syncing mapping', error);
      toast.error(friendlyError(error));
    } finally {
      setMappingSyncing(false);
    }
  };

  const createInvitation = async () => {
    if (!business || !canManageTeam) {
      toast.error('Only owner or manager can invite team members.');
      return;
    }

    const trimmedEmail = inviteEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setInviteSubmitting(true);
    try {
      const { data, error: rpcError } = await getSupabase().rpc('create_partner_invitation', {
        p_business_slug: business.slug,
        p_invited_email: trimmedEmail,
        p_invited_role: inviteRole,
        p_message: inviteMessage.trim(),
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        | { invite_token?: string }
        | null;
      const inviteToken = row?.invite_token || '';
      const baseUrl = window.location.origin;
      const url = inviteToken ? `${baseUrl}/partners/invite/${inviteToken}` : '';

      setLatestInviteUrl(url);
      setInviteEmail('');
      setInviteMessage('');

      toast.success('Invitation created. Share the invite link with your teammate.');
      if (url) {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Invite link copied to clipboard.');
        } catch {
          // Clipboard permissions can fail in restricted browsers.
        }
      }

      await loadPartnerOps(business.id, mappedListingId, bookings);
    } catch (error) {
      console.error('[PartnerBusiness] Failed creating invitation', error);
      toast.error(friendlyError(error));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const updateNotificationStatus = async (
    notificationId: string,
    status: NotificationRecord['status']
  ) => {
    setNotificationUpdateId(notificationId);
    try {
      const { error: updateError } = await getSupabase()
        .from('booking_notification_queue')
        .update({ status, sent_at: status === 'sent' ? new Date().toISOString() : null })
        .eq('id', notificationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('[PartnerBusiness] Failed updating notification status', error);
      toast.error(friendlyError(error));
    } finally {
      setNotificationUpdateId(null);
    }
  };

  const updateSlaStatus = async (
    alertId: string,
    status: SlaAlertRecord['status']
  ) => {
    setSlaUpdateId(alertId);
    try {
      const payload: { status: SlaAlertRecord['status']; resolved_at?: string } = { status };
      if (status === 'resolved') {
        payload.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await getSupabase()
        .from('booking_sla_alerts')
        .update(payload)
        .eq('id', alertId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSlaAlerts((previous) =>
        previous.map((item) =>
          item.id === alertId ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('[PartnerBusiness] Failed updating SLA status', error);
      toast.error(friendlyError(error));
    } finally {
      setSlaUpdateId(null);
    }
  };

  const refreshSlaAlerts = async () => {
    if (!business || !canManageTeam) {
      toast.error('Only owner or manager can refresh SLA alerts.');
      return;
    }

    setSlaRefreshing(true);
    try {
      const { data, error: rpcError } = await getSupabase().rpc('refresh_booking_sla_alerts', {
        p_business_slug: business.slug,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      await loadPartnerOps(business.id, mappedListingId, bookings);
      const openCount = typeof data === 'number' ? data : null;
      if (openCount === null) {
        toast.success('SLA alerts refreshed.');
      } else {
        toast.success(`SLA alerts refreshed (${openCount} open).`);
      }
    } catch (error) {
      console.error('[PartnerBusiness] Failed refreshing SLA alerts', error);
      toast.error(friendlyError(error));
    } finally {
      setSlaRefreshing(false);
    }
  };

  const createDispute = async () => {
    if (!business || !user || !canManageTeam) {
      toast.error('Only owner or manager can open disputes.');
      return;
    }

    const amount = Number(disputeAmount.replace(',', '.'));
    if (!disputeBookingId) {
      toast.error('Choose a booking for this dispute.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Enter a valid dispute amount.');
      return;
    }

    setDisputeSaving(true);
    try {
      const { error: insertError } = await getSupabase().from('booking_disputes').insert({
        booking_id: disputeBookingId,
        business_id: business.id,
        created_by_user_id: user.id,
        dispute_type: disputeType,
        description: disputeDescription.trim(),
        requested_amount: amount,
        currency: 'EUR',
        status: 'open',
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast.success('Dispute opened.');
      setDisputeBookingId('');
      setDisputeType('no_show');
      setDisputeAmount('');
      setDisputeDescription('');
      await loadPartnerOps(business.id, mappedListingId, bookings);
    } catch (error) {
      console.error('[PartnerBusiness] Failed opening dispute', error);
      toast.error(friendlyError(error));
    } finally {
      setDisputeSaving(false);
    }
  };

  const updateDisputeStatus = async (
    disputeId: string,
    status: BookingDisputeRecord['status']
  ) => {
    setDisputeUpdateId(disputeId);
    try {
      const payload: {
        status: BookingDisputeRecord['status'];
        resolved_at?: string | null;
      } = {
        status,
      };
      if (status === 'resolved' || status === 'rejected') {
        payload.resolved_at = new Date().toISOString();
      } else {
        payload.resolved_at = null;
      }

      const { error: updateError } = await getSupabase()
        .from('booking_disputes')
        .update(payload)
        .eq('id', disputeId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setDisputes((previous) =>
        previous.map((item) => (item.id === disputeId ? { ...item, status } : item))
      );
    } catch (error) {
      console.error('[PartnerBusiness] Failed updating dispute status', error);
      toast.error(friendlyError(error));
    } finally {
      setDisputeUpdateId(null);
    }
  };

  const saveSpendEntry = async () => {
    if (!business || !user || !canManageTeam) {
      toast.error('Only owner or manager can record spend entries.');
      return;
    }

    const amount = Number(spendAmount.replace(',', '.'));
    if (!selectedBookingId || !Number.isFinite(amount) || amount < 0) {
      toast.error('Choose a booking and enter a valid amount.');
      return;
    }

    const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId);
    if (!selectedBooking) {
      toast.error('Booking not found. Please refresh and try again.');
      return;
    }

    setSavingSpend(true);
    try {
      const { error: upsertError } = await getSupabase()
        .from('booking_spend_entries')
        .upsert(
          {
            booking_id: selectedBooking.id,
            business_id: business.id,
            user_id: selectedBooking.user_id,
            amount,
            currency: 'EUR',
            entry_source: 'manual',
            entered_by_user_id: user.id,
          },
          {
            onConflict: 'booking_id',
          }
        );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      toast.success('Spend entry saved.');
      setSpendAmount('');
      await loadPartnerOps(business.id, mappedListingId, bookings);
    } catch (error) {
      console.error('[PartnerBusiness] Failed saving spend entry', error);
      toast.error(friendlyError(error));
    } finally {
      setSavingSpend(false);
    }
  };

  const createSnapshot = async () => {
    if (!business || !user || !canManageTeam) {
      toast.error('Only owner or manager can create reconciliation snapshots.');
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(snapshotMonth)) {
      toast.error('Select a valid billing month.');
      return;
    }

    setSnapshotSaving(true);
    try {
      const grossSpend = Number(totalTrackedSpend.toFixed(2));
      const commissionRate = business.partner_tier === 'platinum' ? 0.06 : 0.08;
      const commissionDue = Number((grossSpend * commissionRate).toFixed(2));

      const totals = {
        bookings: bookings.length,
        gross_spend: grossSpend,
        commission_due: commissionDue,
      };

      const { error: upsertError } = await getSupabase()
        .from('partner_reconciliation_snapshots')
        .upsert(
          {
            business_id: business.id,
            billing_month: `${snapshotMonth}-01`,
            currency: 'EUR',
            totals,
            breakdown: {
              pending_bookings: pendingBookings,
              confirmed_bookings: bookings.filter((booking) => booking.status === 'confirmed').length,
              completed_bookings: bookings.filter((booking) => booking.status === 'completed').length,
              commission_rate: commissionRate,
            },
            created_by_user_id: user.id,
          },
          {
            onConflict: 'business_id,billing_month',
          }
        );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      toast.success('Reconciliation snapshot saved.');
      await loadPartnerOps(business.id, mappedListingId, bookings);
    } catch (error) {
      console.error('[PartnerBusiness] Failed creating reconciliation snapshot', error);
      toast.error(friendlyError(error));
    } finally {
      setSnapshotSaving(false);
    }
  };

  const exportSnapshotsCsv = () => {
    if (!snapshots.length) {
      toast.error('No snapshot data available yet.');
      return;
    }

    const rows: string[][] = [
      ['business', 'billing_month', 'currency', 'bookings', 'gross_spend', 'commission_due', 'created_at'],
      ...snapshots.map((snapshot) => [
        business?.name || '',
        toMonthInputValue(snapshot.billing_month),
        snapshot.currency,
        String(snapshot.totals.bookings || 0),
        String(snapshot.totals.gross_spend || 0),
        String(snapshot.totals.commission_due || 0),
        snapshot.created_at,
      ]),
    ];

    downloadCsv(`${businessSlug}-reconciliation.csv`, rows);
  };

  const moderateReview = async (reviewId: string, status: ReviewModerationStatus) => {
    setReviewActionId(reviewId);
    try {
      const { error: rpcError } = await getSupabase().rpc('moderate_review_for_partner', {
        p_review_id: reviewId,
        p_moderation_status: status,
        p_moderation_reason: '',
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setReviewModerationById((previous) => ({ ...previous, [reviewId]: status }));
      toast.success(`Review marked as ${status}.`);
    } catch (error) {
      console.error('[PartnerBusiness] Failed moderating review', error);
      toast.error(friendlyError(error));
    } finally {
      setReviewActionId(null);
    }
  };

  const saveReviewReply = async (reviewId: string) => {
    setReviewActionId(reviewId);
    try {
      const responseText = (reviewReplyDrafts[reviewId] || '').trim();
      const { data, error: rpcError } = await getSupabase().rpc('upsert_review_reply_for_partner', {
        p_review_id: reviewId,
        p_response_text: responseText,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const replyId = (Array.isArray(data) ? data[0] : data) as string | null;
      if (replyId) {
        setReviewRepliesById((previous) => ({
          ...previous,
          [reviewId]: {
            id: replyId,
            review_id: reviewId,
            response_text: responseText,
            updated_at: new Date().toISOString(),
          },
        }));
      }

      toast.success('Review reply saved.');
    } catch (error) {
      console.error('[PartnerBusiness] Failed saving review reply', error);
      toast.error(friendlyError(error));
    } finally {
      setReviewActionId(null);
    }
  };

  const copyLatestInviteUrl = async () => {
    if (!latestInviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      toast.success('Invite link copied.');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const supportWhatsAppUrl = useMemo(() => {
    if (!business) return '';
    return buildSupportWhatsAppUrl(
      buildBookingSupportMessage({
        businessName: business.name,
        serviceType: 'partner-dashboard',
        source: 'partners-business-dashboard',
      })
    );
  }, [business]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6">
            <h1 className="text-heading font-semibold text-foreground">Business Dashboard</h1>
            <p className="text-body-sm text-muted-foreground mt-2">
              Sign in to access your business partner dashboard.
            </p>
            <Button asChild className="mt-4">
              <Link href="/profile">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6 text-body-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading business dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-cream-200 bg-white p-6">
            <div className="text-red-600 text-body-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error || 'Unable to open this dashboard.'}
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/partners">Back to master dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/30">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-5">
        <header className="rounded-xl border border-cream-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[12px] uppercase tracking-wide font-semibold text-ocean-500">Business Dashboard</p>
              <h1 className="text-heading-lg text-foreground mt-1">{business.name}</h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                {categoryName || 'Category pending'} {areaName ? `• ${areaName}` : ''}{' '}
                {membershipRole ? `• ${membershipRole}` : ''} • {business.partner_tier || 'verified'} partner
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button asChild variant="outline">
                <Link href="/partners">Open master dashboard</Link>
              </Button>
              <Button asChild>
                <a href={supportWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} className="mr-1.5" />
                  WhatsApp support
                </a>
              </Button>
            </div>
          </div>
        </header>

        {moduleWarnings.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900 space-y-1">
            <p className="font-semibold">Some advanced modules are pending migration in this environment:</p>
            {moduleWarnings.map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Bookings total</p>
            <p className="text-heading-sm text-foreground mt-1">{bookings.length}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Pending response</p>
            <p className="text-heading-sm text-foreground mt-1">{pendingBookings}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Reviews</p>
            <p className="text-heading-sm text-foreground mt-1">{reviews.length}</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Average rating</p>
            <p className="text-heading-sm text-foreground mt-1 flex items-center gap-1">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              {averageRating || 'N/A'}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3">No-show & Charge Disputes</h2>
            <div className="space-y-2.5 rounded-lg border border-cream-200 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="dispute-booking">Booking</Label>
                <select
                  id="dispute-booking"
                  className="h-10 rounded-md border border-cream-300 bg-white px-3 text-[14px] w-full"
                  value={disputeBookingId}
                  onChange={(event) => setDisputeBookingId(event.target.value)}
                >
                  <option value="">Select booking</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.business_name} • {formatDate(booking.booking_date)} • {booking.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="dispute-type">Type</Label>
                  <select
                    id="dispute-type"
                    className="h-10 rounded-md border border-cream-300 bg-white px-3 text-[14px] w-full"
                    value={disputeType}
                    onChange={(event) => setDisputeType(event.target.value as BookingDisputeRecord['dispute_type'])}
                  >
                    <option value="no_show">No show</option>
                    <option value="deposit">Deposit</option>
                    <option value="charge">Chargeback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dispute-amount">Amount (EUR)</Label>
                  <Input
                    id="dispute-amount"
                    value={disputeAmount}
                    onChange={(event) => setDisputeAmount(event.target.value)}
                    placeholder="40.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dispute-description">Description</Label>
                <Textarea
                  id="dispute-description"
                  rows={2}
                  value={disputeDescription}
                  onChange={(event) => setDisputeDescription(event.target.value)}
                  placeholder="Add context and evidence summary..."
                />
              </div>
              <Button onClick={createDispute} disabled={!canManageTeam || disputeSaving}>
                {disputeSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Open dispute
              </Button>
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3">Dispute Inbox</h2>
            {disputes.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {opsLoading ? 'Loading disputes...' : 'No disputes opened.'}
              </p>
            ) : (
              <div className="space-y-2">
                {disputes.slice(0, 12).map((dispute) => (
                  <div key={dispute.id} className="rounded-lg border border-cream-200 p-3">
                    <p className="text-[13px] font-medium text-foreground">
                      {dispute.dispute_type} • EUR {Number(dispute.requested_amount || 0).toFixed(2)}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Status: {dispute.status} • Booking {dispute.booking_id.slice(0, 8)}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {dispute.description || 'No additional description.'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={disputeUpdateId === dispute.id}
                        onClick={() => updateDisputeStatus(dispute.id, 'under_review')}
                      >
                        Under review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={disputeUpdateId === dispute.id}
                        onClick={() => updateDisputeStatus(dispute.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={disputeUpdateId === dispute.id}
                        onClick={() => updateDisputeStatus(dispute.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <Workflow size={16} className="text-ocean-500" />
              Partner Setup
            </h2>

            <div className="rounded-lg border border-cream-200 p-3">
              <p className="text-[13px] text-muted-foreground">Business to listing mapping</p>
              <p className="text-[13px] mt-1 text-foreground">
                {mappedListingId ? `Listing linked: ${mappedListingId}` : 'No listing linked yet.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={syncBusinessListingMap}
                disabled={!canManageTeam || mappingSyncing}
              >
                {mappingSyncing ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}
                Sync mapping
              </Button>
            </div>

            <div className="rounded-lg border border-cream-200 p-3 mt-3 space-y-2.5">
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <UserPlus2 size={14} className="text-ocean-500" />
                Invite teammate
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  placeholder="manager@business.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="h-10 rounded-md border border-cream-300 bg-white px-3 text-[14px]"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as PartnerRole)}
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-message">Message (optional)</Label>
                <Textarea
                  id="invite-message"
                  rows={2}
                  placeholder="Welcome to our partner dashboard"
                  value={inviteMessage}
                  onChange={(event) => setInviteMessage(event.target.value)}
                />
              </div>
              <Button disabled={!canManageTeam || inviteSubmitting} onClick={createInvitation}>
                {inviteSubmitting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Send invitation
              </Button>
              {latestInviteUrl && (
                <div className="rounded-md bg-ocean-50 border border-ocean-100 p-2.5">
                  <p className="text-[12px] text-ocean-700 break-all">{latestInviteUrl}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-8" onClick={copyLatestInviteUrl}>
                    Copy link
                  </Button>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3">Invitation Activity</h2>
            {invitations.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No invitation activity yet.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-lg border border-cream-200 p-3">
                    <p className="text-[13px] font-medium text-foreground">{invitation.invited_email}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Role: {invitation.invited_role} • Status: {invitation.status}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      Expires: {formatDateTime(invitation.expires_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <article className="xl:col-span-2 rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock3 size={16} className="text-ocean-500" />
              Booking requests
            </h2>
            {!mappedListingId && (
              <p className="text-[13px] text-muted-foreground">
                No listing mapping found yet for this business. Link business and listing to unlock booking inbox.
              </p>
            )}
            {mappedListingId && bookings.length === 0 && (
              <p className="text-[13px] text-muted-foreground">No booking requests yet.</p>
            )}
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-cream-200 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-foreground">
                      {booking.business_name} • {booking.service_type}
                    </p>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${bookingStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {formatDate(booking.booking_date)} • {booking.booking_time || 'Flexible time'} • {booking.party_size} people • {obfuscateUser(booking.user_id)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    >
                      {bookingUpdateId === booking.id ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : null}
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={bookingUpdateId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-ocean-500" />
              Business profile
            </h2>
            <div className="space-y-2 text-[13px]">
              <p><span className="text-muted-foreground">Address:</span> {business.address || 'N/A'}</p>
              <p><span className="text-muted-foreground">Phone:</span> {business.phone || 'N/A'}</p>
              <p><span className="text-muted-foreground">Email:</span> {business.email || 'N/A'}</p>
              <p><span className="text-muted-foreground">Views:</span> {business.view_count || 0}</p>
              <p><span className="text-muted-foreground">Tier:</span> {business.partner_tier || 'verified'}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {business.phone && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`tel:${business.phone}`}>
                    <Phone size={14} className="mr-2" />
                    Call business line
                  </a>
                </Button>
              )}
              {business.website && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={normalizeUrl(business.website)} target="_blank" rel="noopener noreferrer">
                    Open website
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="justify-start">
                <a href="mailto:contact@calvia.app">Contact partner support</a>
              </Button>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3">Notification Queue</h2>
            {notifications.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {opsLoading ? 'Loading notifications...' : 'No queued notifications.'}
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 12).map((notification) => (
                  <div key={notification.id} className="rounded-lg border border-cream-200 p-3">
                    <p className="text-[13px] font-medium text-foreground">
                      {notification.template_key || 'booking notification'}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {notification.recipient_type} • {notification.channel} • {notification.status}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {notification.recipient || 'No recipient'} • {formatDateTime(notification.created_at)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={notificationUpdateId === notification.id}
                        onClick={() => updateNotificationStatus(notification.id, 'sent')}
                      >
                        Mark sent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={notificationUpdateId === notification.id}
                        onClick={() => updateNotificationStatus(notification.id, 'failed')}
                      >
                        Mark failed
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <h2 className="text-body font-semibold text-foreground">SLA Alerts</h2>
              <Button
                size="sm"
                variant="outline"
                disabled={!canManageTeam || slaRefreshing}
                onClick={refreshSlaAlerts}
              >
                {slaRefreshing ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RefreshCw size={13} className="mr-1.5" />}
                Refresh
              </Button>
            </div>

            <div className="rounded-lg bg-cream-50 border border-cream-200 p-3 mb-3">
              <p className="text-[13px] text-foreground">
                Avg response: {slaMetrics.averageResponseMinutes === null ? 'N/A' : `${slaMetrics.averageResponseMinutes} min`}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">Overdue requests: {slaMetrics.overdueCount}</p>
            </div>

            {slaAlerts.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {opsLoading ? 'Loading alerts...' : 'No SLA alerts right now.'}
              </p>
            ) : (
              <div className="space-y-2">
                {slaAlerts.slice(0, 12).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-cream-200 p-3">
                    <p className="text-[13px] font-medium text-foreground">{alert.message}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {alert.alert_type} • Severity {alert.severity} • Due {formatDateTime(alert.due_at)}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Status: {alert.status}</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={slaUpdateId === alert.id}
                        onClick={() => updateSlaStatus(alert.id, 'acknowledged')}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={slaUpdateId === alert.id}
                        onClick={() => updateSlaStatus(alert.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
              <BadgeEuro size={16} className="text-ocean-500" />
              Spend & Reconciliation
            </h2>

            <div className="space-y-2.5 rounded-lg border border-cream-200 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="spend-booking">Booking</Label>
                <select
                  id="spend-booking"
                  value={selectedBookingId}
                  onChange={(event) => setSelectedBookingId(event.target.value)}
                  className="h-10 rounded-md border border-cream-300 bg-white px-3 text-[14px] w-full"
                >
                  <option value="">Select booking</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.business_name} • {formatDate(booking.booking_date)} • {booking.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spend-amount">Spend amount (EUR)</Label>
                <Input
                  id="spend-amount"
                  value={spendAmount}
                  onChange={(event) => setSpendAmount(event.target.value)}
                  placeholder="89.50"
                />
              </div>

              <Button onClick={saveSpendEntry} disabled={!canManageTeam || savingSpend}>
                {savingSpend ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Save spend entry
              </Button>
            </div>

            <div className="rounded-lg border border-cream-200 p-3 mt-3">
              <p className="text-[13px] text-muted-foreground">Tracked spend total</p>
              <p className="text-[22px] font-semibold text-foreground mt-1">EUR {totalTrackedSpend.toFixed(2)}</p>
            </div>

            <div className="space-y-2.5 rounded-lg border border-cream-200 p-3 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="snapshot-month">Billing month</Label>
                <Input
                  id="snapshot-month"
                  type="month"
                  value={snapshotMonth}
                  onChange={(event) => setSnapshotMonth(event.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={createSnapshot} disabled={!canManageTeam || snapshotSaving}>
                  {snapshotSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Save snapshot
                </Button>
                <Button variant="outline" onClick={exportSnapshotsCsv}>
                  Export CSV
                </Button>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground mb-3">Campaign Attribution</h2>
            {attributionSummary.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No attribution data yet.</p>
            ) : (
              <div className="space-y-2">
                {attributionSummary.map((item) => {
                  const conversion = item.bookings ? Math.round((item.confirmed / item.bookings) * 100) : 0;
                  return (
                    <div key={item.source} className="rounded-lg border border-cream-200 p-3">
                      <p className="text-[13px] font-medium text-foreground">{item.source || 'app'}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">
                        {item.bookings} bookings • {item.confirmed} confirmed • {item.completed} completed • {conversion}% confirm rate
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <h3 className="text-[13px] font-semibold text-foreground mt-4 mb-2">Reconciliation snapshots</h3>
            {snapshots.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No snapshots saved yet.</p>
            ) : (
              <div className="space-y-2">
                {snapshots.slice(0, 6).map((snapshot) => (
                  <div key={snapshot.id} className="rounded-lg border border-cream-200 p-3">
                    <p className="text-[13px] font-medium text-foreground">
                      {toMonthInputValue(snapshot.billing_month) || snapshot.billing_month}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Bookings: {snapshot.totals.bookings || 0} • Gross: EUR {(snapshot.totals.gross_spend || 0).toFixed(2)} • Commission: EUR {(snapshot.totals.commission_due || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground mb-3">Reviews for {business.name}</h2>
          {reviews.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No reviews available yet for this business.</p>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 12).map((review) => {
                const moderationStatus = reviewModerationById[review.id] || 'visible';
                const replyText = reviewReplyDrafts[review.id] || '';

                return (
                  <div key={review.id} className="rounded-lg border border-cream-200 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-foreground">
                        {review.title || 'Customer review'} • {obfuscateUser(review.user_id)}
                      </p>
                      <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${reviewStatusClass(moderationStatus)}`}>
                        {moderationStatus}
                      </span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">{formatDate(review.created_at)}</span>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Star
                          key={`${review.id}-${score}`}
                          size={12}
                          className={score <= review.rating ? 'text-amber-500' : 'text-cream-300'}
                          fill={score <= review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <p className="text-[13px] text-foreground/80 mt-1">
                      {review.content || review.comment || 'No written comment.'}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={reviewActionId === review.id}
                        onClick={() => moderateReview(review.id, 'visible')}
                      >
                        Visible
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={reviewActionId === review.id}
                        onClick={() => moderateReview(review.id, 'flagged')}
                      >
                        Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={reviewActionId === review.id}
                        onClick={() => moderateReview(review.id, 'hidden')}
                      >
                        Hide
                      </Button>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <Label htmlFor={`reply-${review.id}`}>Partner reply</Label>
                      <Textarea
                        id={`reply-${review.id}`}
                        rows={2}
                        placeholder="Thank you for your feedback..."
                        value={replyText}
                        onChange={(event) =>
                          setReviewReplyDrafts((previous) => ({
                            ...previous,
                            [review.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => saveReviewReply(review.id)}
                        disabled={reviewActionId === review.id}
                      >
                        {reviewActionId === review.id ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : null}
                        Save reply
                      </Button>
                      {reviewRepliesById[review.id]?.updated_at && (
                        <p className="text-[11px] text-muted-foreground">
                          Last updated {formatDateTime(reviewRepliesById[review.id].updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
