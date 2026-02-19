import type { Metadata } from 'next';
import { DiscoverContent } from './discover-content';

export const metadata: Metadata = {
  title: "Discover | Calvia.app",
  description:
    "Explore categories, neighborhoods, and local business listings across Calvia and Mallorca's southwest.",
  alternates: {
    canonical: '/discover',
  },
};

export default function DiscoverPage() {
  return <DiscoverContent />;
}
