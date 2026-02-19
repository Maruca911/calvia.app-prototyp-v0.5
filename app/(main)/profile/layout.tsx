import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: "Profile | Calvia.app",
  description:
    "Manage your Calvia.app profile, saved places, and account preferences.",
  alternates: {
    canonical: '/profile',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
