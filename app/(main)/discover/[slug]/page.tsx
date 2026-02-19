import type { Metadata } from 'next';
import { CategoryContent } from './category-content';

function humanize(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const categoryName = humanize(params.slug);
  return {
    title: `${categoryName} in Calvia | Calvia.app`,
    description: `Explore ${categoryName} businesses and services in Calvia, Mallorca.`,
    alternates: {
      canonical: `/discover/${params.slug}`,
    },
  };
}

export default function CategoryPage() {
  return <CategoryContent />;
}
