import type { Metadata } from 'next';
import { SubcategoryContent } from './subcategory-content';

function humanize(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface SubCategoryPageProps {
  params: {
    slug: string;
    subSlug: string;
  };
}

export function generateMetadata({ params }: SubCategoryPageProps): Metadata {
  const categoryName = humanize(params.slug);
  const subCategoryName = humanize(params.subSlug);
  return {
    title: `${subCategoryName} in ${categoryName} | Calvia.app`,
    description: `Browse ${subCategoryName} listings in ${categoryName} around Calvia, Mallorca.`,
    alternates: {
      canonical: `/discover/${params.slug}/${params.subSlug}`,
    },
  };
}

export default function SubCategoryPage() {
  return <SubcategoryContent />;
}
