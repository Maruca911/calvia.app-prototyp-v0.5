export type ReviewProvider = 'google' | 'tripadvisor';

const GOOGLE_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'www.google.es',
  'google.es',
];

const TRIPADVISOR_HOSTS = [
  'tripadvisor.com',
  'www.tripadvisor.com',
  'tripadvisor.es',
  'www.tripadvisor.es',
];

function normalizeQueryParts(listingName?: string, listingAddress?: string) {
  return [listingName, listingAddress, 'Calvia', 'Mallorca', 'Spain']
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim());
}

function isAllowedHost(host: string, allowedHosts: string[]) {
  return allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
}

export function buildGoogleReviewUrl(listingName?: string, listingAddress?: string) {
  const query = normalizeQueryParts(listingName, listingAddress).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildTripAdvisorReviewUrl(listingName?: string, listingAddress?: string) {
  const query = normalizeQueryParts(listingName, listingAddress).join(' ');
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;
}

export function isAllowedExternalReviewUrl(provider: ReviewProvider, destinationUrl: string): boolean {
  try {
    const url = new URL(destinationUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }

    const host = url.hostname.toLowerCase();
    if (provider === 'google') {
      return isAllowedHost(host, GOOGLE_HOSTS);
    }
    if (provider === 'tripadvisor') {
      return isAllowedHost(host, TRIPADVISOR_HOSTS);
    }
    return false;
  } catch {
    return false;
  }
}
