import { getSupabase } from '@/lib/supabase';
import { DealsContent } from './deals-content';

export const dynamic = 'force-dynamic';

async function getDeals() {
  const { data, error } = await getSupabase()
    .from('deals')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) console.error('[Deals] getDeals error:', error.message);
  return data ?? [];
}

export default async function DealsPage() {
  const deals = await getDeals();
  return <DealsContent deals={deals} />;
}
