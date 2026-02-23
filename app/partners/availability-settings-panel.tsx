'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarRange, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Provider = 'google' | 'outlook' | 'apple';

interface AvailabilitySettings {
  timezone: string;
  minLeadMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  slotCapacity: number;
  allowWaitlist: boolean;
  blackoutDates: string[];
  weeklyHours: Record<string, Array<{ start: string; end: string }>>;
}

interface CalendarConnection {
  id: string;
  provider: Provider;
  account_email: string;
  external_calendar_id: string;
  sync_direction: 'import_only' | 'export_only' | 'two_way';
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  last_synced_at: string | null;
}

const DEFAULT_SETTINGS: AvailabilitySettings = {
  timezone: 'Europe/Madrid',
  minLeadMinutes: 120,
  maxAdvanceDays: 90,
  slotIntervalMinutes: 30,
  slotCapacity: 4,
  allowWaitlist: true,
  blackoutDates: [],
  weeklyHours: {},
};

const PROVIDERS: Array<{ value: Provider; label: string }> = [
  { value: 'google', label: 'Google Calendar' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'apple', label: 'Apple Calendar' },
];

function parseDateInput(value: string): string[] {
  const seen = new Set<string>();
  value
    .split(/[\s,]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
        seen.add(token);
      }
    });
  return Array.from(seen).slice(0, 180);
}

function statusPill(status: CalendarConnection['status']) {
  if (status === 'connected') return 'bg-sage-100 text-sage-700';
  if (status === 'syncing') return 'bg-ocean-100 text-ocean-700';
  if (status === 'error') return 'bg-red-100 text-red-700';
  return 'bg-cream-200 text-muted-foreground';
}

export function AvailabilitySettingsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);
  const [settings, setSettings] = useState<AvailabilitySettings>(DEFAULT_SETTINGS);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');

  const getAuthHeader = useCallback(async () => {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    if (!session?.access_token) {
      return null;
    }
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const loadAvailability = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Please sign in again to manage availability.');
      }

      const response = await fetch('/api/partners/availability', {
        headers: authHeader,
      });

      const payload = (await response.json()) as {
        settings?: {
          timezone?: string;
          min_lead_minutes?: number;
          max_advance_days?: number;
          slot_interval_minutes?: number;
          slot_capacity?: number;
          allow_waitlist?: boolean;
          blackout_dates?: string[];
          weekly_hours?: Record<string, Array<{ start: string; end: string }>>;
        };
        connections?: CalendarConnection[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load availability settings.');
      }

      const loadedSettings = payload.settings;
      if (loadedSettings) {
        const normalized: AvailabilitySettings = {
          timezone: loadedSettings.timezone || 'Europe/Madrid',
          minLeadMinutes: Number(loadedSettings.min_lead_minutes || 120),
          maxAdvanceDays: Number(loadedSettings.max_advance_days || 90),
          slotIntervalMinutes: Number(loadedSettings.slot_interval_minutes || 30),
          slotCapacity: Number(loadedSettings.slot_capacity || 4),
          allowWaitlist: loadedSettings.allow_waitlist !== false,
          blackoutDates: Array.isArray(loadedSettings.blackout_dates) ? loadedSettings.blackout_dates : [],
          weeklyHours: loadedSettings.weekly_hours || {},
        };
        setSettings(normalized);
        setBlackoutInput(normalized.blackoutDates.join(', '));
      } else {
        setSettings(DEFAULT_SETTINGS);
        setBlackoutInput('');
      }

      setConnections(Array.isArray(payload.connections) ? payload.connections : []);
    } catch (error) {
      console.error('[Partners] Failed loading availability panel', error);
      const message = error instanceof Error ? error.message : 'Failed to load availability settings.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, user]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const connectedProviders = useMemo(
    () => new Set(connections.filter((item) => item.status === 'connected').map((item) => item.provider)),
    [connections]
  );

  const saveSettings = async () => {
    if (!user) {
      toast.error('Please sign in to save availability rules.');
      return;
    }

    setSaving(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Please sign in again to continue.');
      }

      const response = await fetch('/api/partners/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          timezone: settings.timezone,
          minLeadMinutes: settings.minLeadMinutes,
          maxAdvanceDays: settings.maxAdvanceDays,
          slotIntervalMinutes: settings.slotIntervalMinutes,
          slotCapacity: settings.slotCapacity,
          allowWaitlist: settings.allowWaitlist,
          blackoutDates: parseDateInput(blackoutInput),
          weeklyHours: settings.weeklyHours,
        }),
      });

      const payload = (await response.json()) as { settings?: unknown; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save availability rules.');
      }

      setBlackoutInput(parseDateInput(blackoutInput).join(', '));
      toast.success('Availability rules saved.');
    } catch (error) {
      console.error('[Partners] Save availability failed', error);
      const message = error instanceof Error ? error.message : 'Could not save availability rules.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const connectProvider = async (provider: Provider) => {
    if (!user) {
      toast.error('Please sign in to connect calendars.');
      return;
    }

    setConnectingProvider(provider);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Please sign in again to continue.');
      }

      const response = await fetch('/api/partners/calendar-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          provider,
          accountEmail: user.email || '',
          externalCalendarId: user.email || 'primary',
          syncDirection: 'two_way',
        }),
      });

      const payload = (await response.json()) as { connection?: CalendarConnection; error?: string };
      if (!response.ok || !payload.connection) {
        throw new Error(payload.error || `Failed to connect ${provider} calendar.`);
      }

      const connection = payload.connection;
      setConnections((prev) => {
        const next = prev.filter((item) => item.id !== connection.id);
        next.unshift(connection);
        return next;
      });
      toast.success(`${provider[0].toUpperCase()}${provider.slice(1)} calendar connected.`);
    } catch (error) {
      console.error('[Partners] Connect calendar failed', error);
      const message =
        error instanceof Error ? error.message : `Failed to connect ${provider} calendar.`;
      toast.error(message);
    } finally {
      setConnectingProvider(null);
    }
  };

  const disconnectConnection = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Please sign in again to continue.');
      }

      const response = await fetch('/api/partners/calendar-connections', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ id }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to remove calendar connection.');
      }

      setConnections((prev) => prev.filter((item) => item.id !== id));
      toast.success('Calendar disconnected.');
    } catch (error) {
      console.error('[Partners] Disconnect calendar failed', error);
      const message = error instanceof Error ? error.message : 'Failed to remove calendar connection.';
      toast.error(message);
    }
  };

  const refreshConnection = async (id: string) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Please sign in again to continue.');
      }

      const response = await fetch('/api/partners/calendar-connections', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ id, status: 'syncing' }),
      });

      const payload = (await response.json()) as { connection?: CalendarConnection; error?: string };
      if (!response.ok || !payload.connection) {
        throw new Error(payload.error || 'Failed to refresh sync status.');
      }

      const connection = payload.connection;
      setConnections((prev) => prev.map((item) => (item.id === connection.id ? connection : item)));
      toast.success('Calendar sync refreshed.');
    } catch (error) {
      console.error('[Partners] Refresh calendar failed', error);
      const message = error instanceof Error ? error.message : 'Failed to refresh sync status.';
      toast.error(message);
    }
  };

  if (!user) {
    return (
      <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
        <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-2">
          <CalendarRange size={16} className="text-ocean-500" />
          Calendar & Availability
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Sign in with a partner account to connect Google/Outlook/Apple calendars and define booking availability rules.
        </p>
      </article>
    );
  }

  if (loading) {
    return (
      <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5">
        <h2 className="text-body font-semibold text-foreground flex items-center gap-2 mb-3">
          <CalendarRange size={16} className="text-ocean-500" />
          Calendar & Availability
        </h2>
        <div className="text-[13px] text-muted-foreground flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Loading settings...
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-cream-200 bg-white p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-body font-semibold text-foreground flex items-center gap-2">
          <CalendarRange size={16} className="text-ocean-500" />
          Calendar & Availability
        </h2>
        <p className="text-[12px] text-muted-foreground mt-1">
          Configure lead times, slot caps, blackout dates, and connect staff calendars.
        </p>
      </div>

      <div className="space-y-2">
        {PROVIDERS.map((provider) => {
          const connected = connectedProviders.has(provider.value);
          return (
            <div
              key={provider.value}
              className="rounded-lg border border-cream-200 p-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">{provider.label}</p>
                <p className="text-[12px] text-muted-foreground">
                  {connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <Button
                size="sm"
                variant={connected ? 'outline' : 'default'}
                disabled={connectingProvider === provider.value}
                onClick={() => connectProvider(provider.value)}
              >
                {connectingProvider === provider.value ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Connecting
                  </>
                ) : connected ? (
                  'Reconnect'
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="partner-timezone">Timezone</Label>
          <Input
            id="partner-timezone"
            value={settings.timezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
            placeholder="Europe/Madrid"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partner-min-lead">Min lead time (minutes)</Label>
          <Input
            id="partner-min-lead"
            type="number"
            min={0}
            max={1440}
            value={settings.minLeadMinutes}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, minLeadMinutes: Number(e.target.value) || 0 }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="partner-max-advance">Max advance days</Label>
          <Input
            id="partner-max-advance"
            type="number"
            min={1}
            max={365}
            value={settings.maxAdvanceDays}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, maxAdvanceDays: Number(e.target.value) || 1 }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partner-slot-interval">Slot interval (minutes)</Label>
          <Input
            id="partner-slot-interval"
            type="number"
            min={5}
            max={240}
            value={settings.slotIntervalMinutes}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, slotIntervalMinutes: Number(e.target.value) || 30 }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="partner-slot-capacity">Slot capacity (covers/tickets)</Label>
          <Input
            id="partner-slot-capacity"
            type="number"
            min={1}
            max={100}
            value={settings.slotCapacity}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, slotCapacity: Number(e.target.value) || 1 }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partner-blackout">Blackout dates (YYYY-MM-DD)</Label>
          <Input
            id="partner-blackout"
            value={blackoutInput}
            onChange={(e) => setBlackoutInput(e.target.value)}
            placeholder="2026-08-15, 2026-12-25"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-cream-200 p-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">Allow waitlist</p>
          <p className="text-[12px] text-muted-foreground">Users can request full slots and receive updates.</p>
        </div>
        <Switch
          checked={settings.allowWaitlist}
          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowWaitlist: checked }))}
        />
      </div>

      <Button onClick={saveSettings} disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={14} className="mr-1.5 animate-spin" />
            Saving...
          </>
        ) : (
          'Save availability rules'
        )}
      </Button>

      {connections.length > 0 && (
        <div className="space-y-2">
          {connections.map((connection) => (
            <div key={connection.id} className="rounded-lg border border-cream-200 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[13px] font-medium text-foreground">
                  {connection.provider.toUpperCase()} • {connection.account_email || connection.external_calendar_id}
                </p>
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${statusPill(connection.status)}`}>
                  {connection.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-8" onClick={() => refreshConnection(connection.id)}>
                  <RefreshCw size={12} className="mr-1.5" />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => disconnectConnection(connection.id)}>
                  <Unplug size={12} className="mr-1.5" />
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
