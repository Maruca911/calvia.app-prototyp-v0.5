import type { Metadata } from 'next';
import { DealsContent } from './deals-content';

export const metadata: Metadata = {
  title: "Deals | Calvia.app",
  description:
    "Browse active local offers and deal highlights from trusted businesses in Calvia.",
  alternates: {
    canonical: '/deals',
  },
};

export default function DealsPage() {
  return <DealsContent />;
}
