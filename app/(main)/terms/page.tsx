import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Calvia.app',
  description: 'Terms of service for Calvia.app users and partner businesses.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/40">
      <div className="mx-auto max-w-3xl px-5 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ocean-500">Legal</p>
          <h1 className="text-heading-lg text-foreground">Terms of Service</h1>
          <p className="text-body-sm text-muted-foreground">Last updated: February 23, 2026</p>
        </header>

        <section className="rounded-xl border border-cream-200 bg-white p-5 space-y-3">
          <p className="text-body-sm text-muted-foreground">
            By using Calvia.app, you agree to the platform terms for discovery and booking support features.
          </p>
          <p className="text-body-sm text-muted-foreground">
            Calvia.app is currently provided in free-access mode. If paid plans are introduced in a future release,
            updated pricing and billing terms will be published before activation.
          </p>
          <p className="text-body-sm text-muted-foreground">
            Business partners are responsible for availability accuracy, booking confirmations, and service delivery.
            For support, contact{' '}
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
