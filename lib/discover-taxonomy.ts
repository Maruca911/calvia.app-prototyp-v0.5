export const CORE_DISCOVER_CATEGORY_SLUGS = [
  'real-estate',
  'dining',
  'activities',
  'daily-life',
  'health-medical',
  'shopping',
  'education',
  'professional-services',
  'home-services',
  'emergency-services',
] as const;

const coreOrderMap = new Map(
  CORE_DISCOVER_CATEGORY_SLUGS.map((slug, index) => [slug, index] as const)
);

export type CoreDiscoverCategorySlug = (typeof CORE_DISCOVER_CATEGORY_SLUGS)[number];

export function isCoreDiscoverCategorySlug(slug: string): slug is CoreDiscoverCategorySlug {
  return coreOrderMap.has(slug as CoreDiscoverCategorySlug);
}

export function sortByCoreDiscoverOrder<T extends { slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aOrder = coreOrderMap.get(a.slug as CoreDiscoverCategorySlug);
    const bOrder = coreOrderMap.get(b.slug as CoreDiscoverCategorySlug);
    return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
  });
}
