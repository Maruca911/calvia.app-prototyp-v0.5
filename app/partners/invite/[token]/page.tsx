'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

type InvitationAcceptPageProps = {
  params: {
    token: string;
  };
};

function isValidUuid(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
}

export default function PartnerInvitationAcceptPage({ params }: InvitationAcceptPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const token = useMemo(() => params.token?.trim() || '', [params.token]);

  const handleAccept = async () => {
    if (!user) {
      toast.error('Please sign in first.');
      return;
    }

    if (!isValidUuid(token)) {
      toast.error('This invite link is invalid.');
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await getSupabase().rpc('accept_business_invitation', {
        p_invite_token: token,
      });

      if (error) {
        throw new Error(error.message);
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        | { business_id?: string }
        | null;
      const businessId = row?.business_id || null;

      if (!businessId) {
        toast.success('Invitation accepted.');
        router.push('/partners');
        return;
      }

      const { data: business, error: businessError } = await getSupabase()
        .from('businesses')
        .select('slug')
        .eq('id', businessId)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      toast.success('Invitation accepted. Welcome to your partner dashboard.');
      if (business?.slug) {
        router.push(`/partners/${business.slug}`);
      } else {
        router.push('/partners');
      }
    } catch (error) {
      console.error('[PartnersInvite] Failed to accept invitation', error);
      const message = error instanceof Error ? error.message : 'Could not accept invitation.';
      toast.error(message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/30">
      <div className="mx-auto max-w-xl px-4 py-10">
        <section className="rounded-xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-heading font-semibold text-foreground">Accept Partner Invitation</h1>
          <p className="text-body-sm text-muted-foreground mt-2">
            Join your business dashboard to manage bookings, reviews, and partner operations.
          </p>

          {!isValidUuid(token) ? (
            <p className="text-body-sm text-red-600 mt-4">This invitation link is invalid.</p>
          ) : user ? (
            <Button className="mt-4" onClick={handleAccept} disabled={accepting}>
              {accepting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Accept invitation
            </Button>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-body-sm text-muted-foreground">Sign in to accept this invitation.</p>
              <Button asChild>
                <Link href="/profile">Sign in</Link>
              </Button>
            </div>
          )}

          <Button asChild variant="outline" className="mt-3">
            <Link href="/partners">Back to partner dashboard</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
