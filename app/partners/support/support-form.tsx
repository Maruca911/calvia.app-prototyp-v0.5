'use client';

import { useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const INITIAL_FORM = {
  name: '',
  email: '',
  business: '',
  topic: '',
  message: '',
};

export function PartnerSupportForm() {
  const [form, setForm] = useState(INITIAL_FORM);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 1 && form.email.trim().length > 3 && form.message.trim().length > 10;
  }, [form]);

  const openEmail = () => {
    const subject = `[Partner Support] ${form.topic.trim() || 'General request'} - ${form.business.trim() || 'Unknown business'}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Business: ${form.business.trim() || 'N/A'}`,
      `Topic: ${form.topic.trim() || 'General'}`,
      '',
      'Message:',
      form.message.trim(),
    ].join('\n');

    const mailto = `mailto:contact@calvia.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <section className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
      <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
        <Mail size={16} className="text-ocean-500" />
        Contact Support
      </h2>
      <p className="text-[13px] text-muted-foreground mb-3">
        Send an email-form request to <span className="font-medium text-foreground">contact@calvia.app</span>.
      </p>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="support-name">Name</Label>
            <Input
              id="support-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-email">Email</Label>
            <Input
              id="support-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@business.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="support-business">Business</Label>
            <Input
              id="support-business"
              value={form.business}
              onChange={(e) => setForm((prev) => ({ ...prev, business: e.target.value }))}
              placeholder="Business name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-topic">Topic</Label>
            <Input
              id="support-topic"
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
              placeholder="Billing, bookings, integrations..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support-message">Message</Label>
          <Textarea
            id="support-message"
            rows={5}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Describe the issue or request in detail..."
          />
        </div>

        <Button onClick={openEmail} disabled={!canSubmit}>
          Open Email Draft
        </Button>
      </div>
    </section>
  );
}
