import './globals.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ServiceWorkerRegister } from '@/components/sw-register';
import { Toaster } from 'sonner';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: "Calvia.app | The Modern Yellow Pages of Mallorca's Southwest",
  description:
    "Find trusted local businesses across Calvia. The modern yellow pages for residents, second-home owners, and visitors in Mallorca's southwest.",
  manifest: '/manifest.json',
  metadataBase: new URL('https://calvia.app'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Calvia',
  },
  openGraph: {
    title: "Calvia.app | The Modern Yellow Pages of Mallorca's Southwest",
    description:
      "Discover trusted local businesses, services, and guides across Calvia and Mallorca's southwest coast.",
    url: 'https://calvia.app',
    siteName: 'Calvia.app',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Calvia.app | The Modern Yellow Pages of Mallorca's Southwest",
    description:
      "The modern yellow pages for Calvia: trusted local businesses, services, and guides in Mallorca's southwest.",
  },
  keywords: [
    'Calvia',
    'Mallorca',
    'yellow pages',
    'business directory',
    'second-home owners',
    'restaurants Calvia',
    'real estate Mallorca',
    'wellness Mallorca',
    'Santa Ponsa',
    'Bendinat',
    'Puerto Portals',
    'local services Calvia',
  ],
  themeColor: '#014BB5',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calvia.app',
  alternateName: 'Calvia',
  url: 'https://calvia.app',
  description:
    "The modern yellow pages for Mallorca's southwest. Discover trusted local businesses, services, and guides across Calvia.",
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  areaServed: {
    '@type': 'Place',
    name: 'Calvia, Mallorca, Spain',
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.565,
      longitude: 2.506,
    },
  },
  provider: {
    '@type': 'Organization',
    name: 'Calvia.app',
    url: 'https://calvia.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${montserrat.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
