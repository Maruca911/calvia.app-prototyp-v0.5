const DEFAULT_SUPPORT_WHATSAPP_NUMBER = '34600000000';

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function getSupportWhatsappNumber(): string {
  const configured = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER;
  if (!configured) {
    return DEFAULT_SUPPORT_WHATSAPP_NUMBER;
  }
  const digits = digitsOnly(configured);
  return digits || DEFAULT_SUPPORT_WHATSAPP_NUMBER;
}

export function buildSupportWhatsAppUrl(message: string): string {
  const number = getSupportWhatsappNumber();
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildBookingSupportMessage(params: {
  businessName: string;
  serviceType?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  partySize?: number | null;
  source?: string;
}) {
  const lines = [
    `Hi Calvia team, I need booking support.`,
    `Business: ${params.businessName || 'N/A'}`,
    `Service: ${params.serviceType || 'N/A'}`,
    `Date: ${params.bookingDate || 'Flexible'}`,
    `Time: ${params.bookingTime || 'Flexible'}`,
    `Party size: ${params.partySize || 1}`,
    `Source: ${params.source || 'Calvia.app'}`,
  ];
  return lines.join('\n');
}
