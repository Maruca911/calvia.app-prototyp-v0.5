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
  title: 'Calvia | Your Discreet Concierge in Mallorca',
  description: 'Effortless luxury in Calvia, Mallorca. Discover premium services, real estate, dining, wellness, and lifestyle experiences for discerning residents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Calvia',
  },
  openGraph: {
    title: 'Calvia | Your Discreet Concierge',
    description: 'Premium concierge services for second-home owners in Calvia, Mallorca.',
    url: 'https://calvia.app',
    siteName: 'Calvia',
    type: 'website',
  },
  themeColor: '#003366',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
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
