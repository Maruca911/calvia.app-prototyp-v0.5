'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  UtensilsCrossed,
  Car,
  AlertTriangle,
  Lightbulb,
  PenLine,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface RequestFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: string | null;
  onSubmitted: () => void;
}

const TYPE_CONFIG: Record<string, { title: string; icon: typeof UtensilsCrossed; fields: FieldDef[] }> = {
  restaurant_booking: {
    title: 'Restaurant Booking',
    icon: UtensilsCrossed,
    fields: [
      { key: 'restaurant_name', label: 'Restaurant (optional)', placeholder: 'e.g. Ca\'s Cuiner, or leave blank for suggestions', type: 'text' },
      { key: 'party_size', label: 'Number of guests', placeholder: '2', type: 'number' },
      { key: 'date', label: 'Date', placeholder: '', type: 'date' },
      { key: 'time', label: 'Preferred time', placeholder: '20:00', type: 'time' },
      { key: 'cuisine_pref', label: 'Cuisine preference (optional)', placeholder: 'e.g. Mediterranean, seafood, any', type: 'text' },
      { key: 'notes', label: 'Special requests', placeholder: 'Allergies, occasion, seating preference...', type: 'textarea' },
    ],
  },
  taxi_transfer: {
    title: 'Taxi / Transfer',
    icon: Car,
    fields: [
      { key: 'pickup', label: 'Pickup location', placeholder: 'e.g. Your villa address or Palma Airport', type: 'text' },
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Puerto Portals, Palma centre', type: 'text' },
      { key: 'date', label: 'Date', placeholder: '', type: 'date' },
      { key: 'time', label: 'Pickup time', placeholder: '10:00', type: 'time' },
      { key: 'passengers', label: 'Number of passengers', placeholder: '2', type: 'number' },
      { key: 'notes', label: 'Notes', placeholder: 'Luggage, child seats, return trip...', type: 'textarea' },
    ],
  },
  recommendation: {
    title: 'Recommend Me Something',
    icon: Lightbulb,
    fields: [
      { key: 'interests', label: 'What are you in the mood for?', placeholder: 'e.g. A quiet dinner, a day on the water, family activity...', type: 'textarea' },
      { key: 'group_size', label: 'Group size', placeholder: '2 adults, 1 child', type: 'text' },
      { key: 'budget', label: 'Budget range (optional)', placeholder: 'e.g. moderate, no limit', type: 'text' },
      { key: 'date', label: 'When?', placeholder: '', type: 'date' },
    ],
  },
  report_issue: {
    title: 'Report an Issue',
    icon: AlertTriangle,
    fields: [
      { key: 'issue_type', label: 'Issue type', placeholder: 'e.g. Property problem, noise, safety', type: 'text' },
      { key: 'location', label: 'Location', placeholder: 'Your address or area', type: 'text' },
      { key: 'description', label: 'Describe the issue', placeholder: 'Please provide as much detail as possible...', type: 'textarea' },
      { key: 'urgency', label: 'Urgency', placeholder: 'Low / Medium / High', type: 'text' },
    ],
  },
  custom_request: {
    title: 'Custom Request',
    icon: PenLine,
    fields: [
      { key: 'subject', label: 'What do you need?', placeholder: 'e.g. Hire a private chef, rent bikes, book a spa...', type: 'text' },
      { key: 'details', label: 'Details', placeholder: 'Give us as much info as you can and we will handle the rest.', type: 'textarea' },
      { key: 'date', label: 'Date needed (optional)', placeholder: '', type: 'date' },
    ],
  },
};

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'date' | 'time' | 'textarea';
}

export function RequestFormDrawer({ open, onOpenChange, requestType, onSubmitted }: RequestFormDrawerProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const config = requestType ? TYPE_CONFIG[requestType] : null;

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!config || !requestType) return;

    const hasContent = Object.values(formData).some(v => v.trim().length > 0);
    if (!hasContent) {
      toast.error('Please fill in at least one field');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        request_type: requestType,
        details: formData,
      };

      if (user) {
        payload.user_id = user.id;
      } else {
        payload.session_id = getSessionId();
      }

      const { data, error } = await getSupabase()
        .from('concierge_requests')
        .insert(payload)
        .select('reference_number')
        .maybeSingle();

      if (error) throw error;

      setRefNumber(data?.reference_number || '');
      setSubmitted(true);
      toast.success('Request submitted!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({});
      setSubmitted(false);
      setRefNumber('');
      if (submitted) onSubmitted();
    }
    onOpenChange(isOpen);
  };

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ocean-50 flex items-center justify-center">
              <Icon size={20} className="text-ocean-500" />
            </div>
            <DrawerTitle className="text-heading-sm font-semibold">
              {config.title}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-sage-500" />
              </div>
              <div>
                <h3 className="text-heading-sm font-semibold text-foreground">
                  Request Received
                </h3>
                <p className="text-body text-muted-foreground mt-2">
                  We will get back to you shortly.
                </p>
              </div>
              {refNumber && (
                <div className="inline-block bg-cream-100 rounded-lg px-5 py-3">
                  <p className="text-[13px] text-muted-foreground mb-1">Reference</p>
                  <p className="font-mono text-[17px] font-semibold text-ocean-500 tracking-wider">
                    {refNumber}
                  </p>
                </div>
              )}
              <Button onClick={() => handleClose(false)} className="mt-4 w-full min-h-[48px]">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[15px] font-medium text-foreground mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-lg border border-cream-300 bg-cream-50 px-4 py-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent resize-none"
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="min-h-[48px] bg-cream-50 border-cream-300 text-body rounded-lg"
                    />
                  )}
                </div>
              ))}

              {!user && (
                <p className="text-[13px] text-muted-foreground bg-cream-100 rounded-lg p-3">
                  Sign in to track this request and receive updates.
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[52px] text-body mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function getSessionId(): string {
  const key = 'calvia_session_id';
  let id = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!id) {
    id = crypto.randomUUID();
    if (typeof window !== 'undefined') localStorage.setItem(key, id);
  }
  return id;
}
