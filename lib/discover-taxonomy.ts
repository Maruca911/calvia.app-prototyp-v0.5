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

const coreOrderMap = (CORE_DISCOVER_CATEGORY_SLUGS as readonly string[]).reduce(
  (acc, slug, index) => {
    acc[slug] = index;
    return acc;
  },
  {} as Record<string, number>
);

export function isCoreDiscoverCategorySlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(coreOrderMap, slug);
}

export function sortByCoreDiscoverOrder<T extends { slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aOrder = coreOrderMap[a.slug];
    const bOrder = coreOrderMap[b.slug];
    return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
  });
}
