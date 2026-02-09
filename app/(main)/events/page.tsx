import { getSupabase } from '@/lib/supabase';
import { EventsContent } from './events-content';

export const dynamic = 'force-dynamic';

async function getEvents() {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .gte('event_date', new Date(Date.now() - 86400000).toISOString())
    .order('event_date', { ascending: true });
  if (error) console.error('[Events] getEvents error:', error.message);
  return data ?? [];
}

export default async function EventsPage() {
  const events = await getEvents();
  return <EventsContent events={events} />;
}
