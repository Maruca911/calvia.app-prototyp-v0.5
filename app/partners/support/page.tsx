import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpenCheck, HelpCircle, LifeBuoy, Mail } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PartnerSupportForm } from './support-form';

export const metadata: Metadata = {
  title: 'Partner Support & Knowledge Base | Calvia.app',
  description:
    'Partner support center for bookings, billing, integrations, FAQs, and service documentation.',
  alternates: {
    canonical: '/partners/support',
  },
};

const faqs = [
  {
    id: 'faq-1',
    q: 'How quickly should we respond to a booking request?',
    a: 'Target: under 15 minutes during business hours. Faster response improves conversion and ranking.',
  },
  {
    id: 'faq-2',
    q: 'How are partner fees charged?',
    a: 'Fees are consolidated monthly with invoice lines by booking source and service type.',
  },
  {
    id: 'faq-3',
    q: 'Can we connect our calendar and POS?',
    a: 'Yes. Google/Outlook/Apple calendars and major POS providers are supported in staged rollout.',
  },
  {
    id: 'faq-4',
    q: 'How are disputes handled?',
    a: 'No-show and charge disputes can be opened in dashboard with booking evidence and reviewed by support.',
  },
];

const knowledgeBase = [
  {
    title: 'Partner Onboarding Checklist',
    summary: 'Profile verification, availability setup, booking policy, and payment setup.',
  },
  {
    title: 'Booking Operations Playbook',
    summary: 'Best practices for acceptance speed, confirmations, and no-show prevention.',
  },
  {
    title: 'Billing, VAT & Reconciliation Guide',
    summary: 'How to export fee invoices, reconcile payouts, and prepare monthly reporting.',
  },
  {
    title: 'Campaign Attribution Guide',
    summary: 'Tracking ad/content performance and understanding source-level conversion.',
  },
];

export default function PartnerSupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-ocean-50/40">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <header className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ocean-500">
            Partner Support
          </p>
          <h1 className="text-heading-lg text-foreground mt-1">
            Help Center & Knowledge Base
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Resolve operational issues quickly, contact support, and learn the full partner service scope.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button asChild variant="outline">
              <Link href="/partners">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="mailto:contact@calvia.app">
                <Mail size={15} className="mr-1.5" />
                contact@calvia.app
              </Link>
            </Button>
          </div>
        </header>

        <PartnerSupportForm />

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-ocean-500" />
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-[14px] text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="knowledge-base" className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
            <BookOpenCheck size={16} className="text-ocean-500" />
            Knowledge Base
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {knowledgeBase.map((item) => (
              <article key={item.title} className="rounded-lg border border-cream-200 p-3">
                <h3 className="text-[14px] font-semibold text-foreground">{item.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-1">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
          <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-2">
            <LifeBuoy size={16} className="text-ocean-500" />
            Escalation Path
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Critical booking issues: include booking ID, customer name initials, timestamp, and desired resolution.
            Standard response target is under 4 business hours.
          </p>
        </section>
      </div>
    </div>
  );
}
