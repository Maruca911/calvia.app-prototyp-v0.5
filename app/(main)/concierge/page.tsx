import type { Metadata } from 'next';
import { ConciergeContent } from './concierge-content';

export const metadata: Metadata = {
  title: "Concierge | Calvia.app",
  description:
    "Request local support and curated recommendations for services, activities, and practical needs in Calvia.",
  alternates: {
    canonical: '/concierge',
  },
};

export default function ConciergePage() {
  return <ConciergeContent />;
}
