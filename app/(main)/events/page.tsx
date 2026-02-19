import type { Metadata } from 'next';
import { EventsContent } from './events-content';

export const metadata: Metadata = {
  title: "Events | Calvia.app",
  description:
    "Find upcoming local events, community activities, and seasonal highlights in Calvia.",
  alternates: {
    canonical: '/events',
  },
};

export default function EventsPage() {
  return <EventsContent />;
}
