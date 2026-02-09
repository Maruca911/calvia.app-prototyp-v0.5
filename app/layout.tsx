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
  title: 'Calvia App | Your Discreet Concierge in Mallorca',
  description:
    'Calvia App is the premium concierge service for second-home owners and visitors in Calvia, southwest Mallorca. Discover dining, wellness, real estate, local services, a loyalty rewards programme, and curated lifestyle experiences.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://calvia.app'),
  alternates: {
    canonical: '/',
  },
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
    title: 'Calvia App | Your Discreet Concierge in Mallorca',
    description:
      'Premium concierge services, local business directory, dining guides, wellness retreats, and a loyalty rewards programme for Calvia, southwest Mallorca.',
    url: 'https://calvia.app',
    siteName: 'Calvia App',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calvia App | Your Discreet Concierge in Mallorca',
    description:
      'Discover the best of Calvia, Mallorca. Dining, wellness, real estate, local services, and loyalty rewards in one premium concierge app.',
  },
  keywords: [
    'Calvia',
    'Mallorca',
    'concierge',
    'second home',
    'luxury lifestyle',
    'restaurants Calvia',
    'real estate Mallorca',
    'wellness Mallorca',
    'Santa Ponsa',
    'Bendinat',
    'Puerto Portals',
    'loyalty programme',
    'local services Calvia',
  ],
  themeColor: '#003366',
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
  name: 'Calvia App',
  alternateName: 'Calvia',
  url: 'https://calvia.app',
  description:
    'Premium concierge app for second-home owners and visitors in Calvia, southwest Mallorca. Discover dining, wellness, real estate, local services, and earn loyalty rewards.',
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
    name: 'Calvia App',
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
