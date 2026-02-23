import type { Metadata } from 'next';
import { BusinessDashboardContent } from './business-dashboard-content';

type PartnerBusinessPageProps = {
  params: {
    businessSlug: string;
  };
};

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PartnerBusinessPageProps): Promise<Metadata> {
  const prettyName = titleCaseSlug(params.businessSlug);
  return {
    title: `${prettyName} | Partner Dashboard | Calvia.app`,
    description: `Business partner dashboard for ${prettyName} on Calvia.app`,
    alternates: {
      canonical: `/partners/${params.businessSlug}`,
    },
  };
}

export default function PartnerBusinessPage({ params }: PartnerBusinessPageProps) {
  return <BusinessDashboardContent businessSlug={params.businessSlug} />;
}
