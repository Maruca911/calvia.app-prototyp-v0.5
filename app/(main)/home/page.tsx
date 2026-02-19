import type { Metadata } from 'next';
import { HomeContent } from './home-content';

export const metadata: Metadata = {
  title: "Home | Calvia.app",
  description:
    "Discover trusted local businesses, deals, events, and practical guides for Mallorca's southwest.",
  alternates: {
    canonical: '/home',
  },
};

export default function HomePage() {
  return <HomeContent />;
}
