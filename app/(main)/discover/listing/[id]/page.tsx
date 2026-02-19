import type { Metadata } from 'next';
import { ListingPageContent } from './listing-page-content';

interface ListingPageProps {
  params: {
    id: string;
  };
}

export function generateMetadata({ params }: ListingPageProps): Metadata {
  return {
    title: 'Business Listing Details | Calvia.app',
    description: 'View contact details, services, and location for this Calvia business listing.',
    alternates: {
      canonical: `/discover/listing/${params.id}`,
    },
  };
}

export default function ListingPage() {
  return <ListingPageContent />;
}
