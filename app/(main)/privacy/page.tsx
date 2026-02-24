import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Calvia.app',
  description: 'Privacy policy for Calvia.app services, including bookings and partner interactions.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/40">
      <div className="mx-auto max-w-3xl px-5 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ocean-500">Legal</p>
          <h1 className="text-heading-lg text-foreground">Privacy Policy</h1>
          <p className="text-body-sm text-muted-foreground">Last updated: February 23, 2026</p>
        </header>

        <section className="rounded-xl border border-cream-200 bg-white p-5 space-y-3">
          <p className="text-body-sm text-muted-foreground">
            Calvia.app processes account, booking, and partner interaction data to provide discovery and booking services.
          </p>
          <p className="text-body-sm text-muted-foreground">
            We collect only the information required to run the product, support customer service, and comply with
            legal obligations. Sensitive payment data is processed by Stripe and is not stored directly by Calvia.app.
          </p>
          <p className="text-body-sm text-muted-foreground">
            To request data access, correction, or deletion, contact{' '}
            <a href="mailto:contact@calvia.app" className="text-ocean-500 hover:underline">
              contact@calvia.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
