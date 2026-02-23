import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeEuro,
  CalendarClock,
  Clock3,
  CreditCard,
  Database,
  FileSearch,
  FileText,
  LineChart,
  Megaphone,
  MessageSquare,
  PieChart,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from 'lucide-react';
import { CalviaLogo, CalviaWordmark } from '@/components/calvia-logo';
import { Button } from '@/components/ui/button';
import { AvailabilitySettingsPanel } from './availability-settings-panel';

export const metadata: Metadata = {
  title: 'Partner Dashboard Preview | Calvia.app',
  description:
    'Preview of the Calvia partner dashboard for bookings, analytics, billing, and partner services.',
  alternates: {
    canonical: '/partners',
  },
};

const inboxBookings = [
  {
    id: 'BK-2941',
    business: 'Tutti Sensi',
    guest: 'Lena K.',
    service: 'Dinner',
    date: '2026-02-28 20:30',
    status: 'New',
  },
  {
    id: 'BK-2938',
    business: 'Bendinat Wellness',
    guest: 'Chris M.',
    service: 'Massage',
    date: '2026-02-27 11:00',
    status: 'Confirmed',
  },
  {
    id: 'BK-2932',
    business: 'Portals Padel Club',
    guest: 'Marta D.',
    service: 'Court',
    date: '2026-02-25 18:00',
    status: 'Pending',
  },
];

const serviceRequests = [
  { name: 'Instagram Content Pack', price: 'EUR 390 / month', eta: '3 business days' },
  { name: 'Sponsored Discover Placement', price: 'EUR 220 / week', eta: '24h approval' },
  { name: 'Landing Page Refresh', price: 'EUR 980 one-time', eta: '7 business days' },
];

const loyaltySummary = [
  { label: 'Customers with points activity', value: '184' },
  { label: 'Redeemed discounts this month', value: '49' },
  { label: 'Avg. ticket uplift from members', value: '+17%' },
];

const disputes = [
  { bookingId: 'BK-2929', type: 'No-show', amount: 'EUR 40 deposit', status: 'Under review' },
  { bookingId: 'BK-2912', type: 'Late cancellation', amount: 'EUR 25', status: 'Resolved' },
];

const reviewInbox = [
  { business: 'Tutti Sensi', score: '4/5', note: 'Great food, slower service on terrace.' },
  { business: 'Bendinat Wellness', score: '5/5', note: 'Fantastic staff and smooth booking.' },
];

const campaignAttribution = [
  { source: 'Discover Sponsored', bookings: 28, cpa: 'EUR 7.86' },
  { source: 'Instagram Content Pack', bookings: 17, cpa: 'EUR 9.40' },
  { source: 'Push Campaign', bookings: 12, cpa: 'EUR 5.30' },
];

const slaAlerts = [
  { title: 'Booking BK-2941 pending > 20 min', severity: 'High' },
  { title: 'Reply rate below target this week', severity: 'Medium' },
];

function statusClass(status: string) {
  if (status === 'New') return 'bg-ocean-100 text-ocean-700';
  if (status === 'Confirmed') return 'bg-sage-100 text-sage-700';
  return 'bg-cream-200 text-foreground';
}

export default function PartnerDashboardPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/40">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <header className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <CalviaLogo size={28} />
                <CalviaWordmark />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ocean-500">
                Partner Dashboard Preview
              </p>
              <h1 className="text-heading-lg text-foreground mt-1">
                Operations Hub for Local Partners
              </h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                Receive and track bookings, monitor fees, manage member rewards, and request growth services.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/bookings">Open Consumer App</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/partners/support">Support Center</Link>
              </Button>
              <Button asChild>
                <Link href="mailto:partners@calvia.app">Request Early Access</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Membership tier</p>
            <p className="text-body font-semibold text-foreground mt-1 flex items-center gap-2">
              <ShieldCheck size={16} className="text-ocean-500" />
              Verified Partner
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">Upgrade to Platinum for lower booking fees.</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Bookings this month</p>
            <p className="text-heading-sm text-foreground mt-1">126</p>
            <p className="text-[12px] text-sage-700 mt-1">+18% vs last month</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Commission due (est.)</p>
            <p className="text-heading-sm text-foreground mt-1">EUR 324</p>
            <p className="text-[12px] text-muted-foreground mt-1">Auto-charge on March 1</p>
          </article>
          <article className="rounded-xl border border-cream-200 bg-white p-4">
            <p className="text-[13px] text-muted-foreground">Card connection</p>
            <p className="text-body font-semibold text-foreground mt-1 flex items-center gap-2">
              <CreditCard size={16} className="text-ocean-500" />
              Connected •••• 4482
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">SEPA + card backup enabled.</p>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <article className="xl:col-span-2 rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-body font-semibold text-foreground flex items-center gap-2">
                <CalendarClock size={16} className="text-ocean-500" />
                Booking Inbox
              </h2>
              <Button size="sm" variant="outline">View all</Button>
            </div>
            <div className="space-y-2">
              {inboxBookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-cream-200 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-foreground">
                      {booking.business} • {booking.service}
                    </p>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${statusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {booking.guest} • {booking.date} • {booking.id}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-8">Confirm</Button>
                    <Button size="sm" variant="outline" className="h-8">Decline</Button>
                    <Button size="sm" variant="ghost" className="h-8">Message guest</Button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <LineChart size={16} className="text-ocean-500" />
              Loyalty & Spend Insights
            </h2>
            <div className="space-y-2.5">
              {loyaltySummary.map((item) => (
                <div key={item.label} className="rounded-lg bg-cream-50 border border-cream-200 p-3">
                  <p className="text-[12px] text-muted-foreground">{item.label}</p>
                  <p className="text-[17px] font-semibold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mt-3">
              Customer-level data should be consent-based and GDPR compliant by default.
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-ocean-500" />
              Spend Tracking
            </h2>
            <div className="space-y-2">
              <div className="rounded-lg border border-cream-200 p-3">
                <p className="text-[13px] font-medium text-foreground">Manual spend entry</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Add receipt amount per member booking to improve reward accuracy.
                </p>
              </div>
              <div className="rounded-lg border border-cream-200 p-3">
                <p className="text-[13px] font-medium text-foreground">POS integration (next)</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Stripe Terminal, SumUp, Square, Lightspeed, and Shopify POS connectors.
                </p>
              </div>
            </div>
            <Button size="sm" className="mt-3">Configure integrations</Button>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <Megaphone size={16} className="text-ocean-500" />
              Services Marketplace
            </h2>
            <div className="space-y-2">
              {serviceRequests.map((service) => (
                <div key={service.name} className="rounded-lg border border-cream-200 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{service.name}</p>
                    <p className="text-[12px] text-muted-foreground">{service.price} • ETA {service.eta}</p>
                  </div>
                  <Button size="sm" variant="outline">Request</Button>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <AvailabilitySettingsPanel />

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-ocean-500" />
              No-show, Deposit & Disputes
            </h2>
            <div className="space-y-2">
              {disputes.map((item) => (
                <div key={item.bookingId} className="rounded-lg border border-cream-200 p-3">
                  <p className="text-[13px] font-medium text-foreground">{item.bookingId} • {item.type}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{item.amount} • {item.status}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <BadgeEuro size={16} className="text-ocean-500" />
              Invoices, VAT & Reconciliation
            </h2>
            <div className="space-y-2">
              <div className="rounded-lg border border-cream-200 p-3">
                <p className="text-[13px] font-medium text-foreground">Invoice register (AEAT-ready export)</p>
                <p className="text-[12px] text-muted-foreground mt-1">Fee invoices, VAT breakdown, payment references.</p>
              </div>
              <div className="rounded-lg border border-cream-200 p-3">
                <p className="text-[13px] font-medium text-foreground">Payout reconciliation</p>
                <p className="text-[12px] text-muted-foreground mt-1">Settlement vs booking lines with downloadable CSV.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-ocean-500" />
              Reviews Inbox
            </h2>
            <div className="space-y-2">
              {reviewInbox.map((review) => (
                <div key={`${review.business}-${review.note}`} className="rounded-lg border border-cream-200 p-3">
                  <p className="text-[13px] font-medium text-foreground">{review.business} • {review.score}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{review.note}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-8">Reply</Button>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <PieChart size={16} className="text-ocean-500" />
              Campaign Attribution
            </h2>
            <div className="space-y-2">
              {campaignAttribution.map((item) => (
                <div key={item.source} className="rounded-lg border border-cream-200 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{item.source}</p>
                    <p className="text-[12px] text-muted-foreground">{item.bookings} bookings</p>
                  </div>
                  <p className="text-[12px] font-semibold text-ocean-600">{item.cpa}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
            <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock3 size={16} className="text-ocean-500" />
              SLA Alerts
            </h2>
            <div className="space-y-2">
              {slaAlerts.map((alert) => (
                <div key={alert.title} className="rounded-lg border border-cream-200 p-3">
                  <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Severity: {alert.severity}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-ocean-500" />
            Key Features To Add Next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
            <div className="rounded-lg border border-cream-200 p-3">
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <Database size={14} className="text-ocean-500" />
                Consent-safe CRM
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">Opt-in guest profiles, visit history, and preferences.</p>
            </div>
            <div className="rounded-lg border border-cream-200 p-3">
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-ocean-500" />
                Invoice Center
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">Download invoices, VAT details, payout statements.</p>
            </div>
            <div className="rounded-lg border border-cream-200 p-3">
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <CalendarClock size={14} className="text-ocean-500" />
                Calendar Sync
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">Google/Outlook/Apple calendar sync for staff teams.</p>
            </div>
            <div className="rounded-lg border border-cream-200 p-3">
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <LineChart size={14} className="text-ocean-500" />
                SLA + Performance
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">Response time, conversion rate, no-show analytics.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground mb-3 flex items-center gap-2">
            <Ticket size={16} className="text-ocean-500" />
            Support & Knowledge Base
          </h2>
          <p className="text-[14px] text-muted-foreground mb-3">
            Contact support at contact@calvia.app, browse FAQs, and read service documentation.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link href="/partners/support">Open Support Center</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="mailto:contact@calvia.app">Email contact@calvia.app</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/partners/support#knowledge-base">
                <FileSearch size={14} className="mr-1.5" />
                Open knowledge base
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
