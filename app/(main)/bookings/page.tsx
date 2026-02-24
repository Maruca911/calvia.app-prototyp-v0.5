import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isBookingsEnabled } from '@/lib/features';
import { BookingsContent } from './bookings-content';

export const metadata: Metadata = {
  title: 'Bookings | Calvia.app',
  description:
    'Book tables, classes, and partner experiences in Calvia with direct in-app booking requests.',
  alternates: {
    canonical: '/bookings',
  },
};

export default function BookingsPage() {
  if (!isBookingsEnabled) {
    redirect('/home');
  }

  return <BookingsContent />;
}
