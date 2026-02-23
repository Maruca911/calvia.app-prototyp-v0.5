'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { KeyRound, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasskeyCredential {
  credentialId: string;
  friendlyName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface RegisterOptionsResponse {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
  friendlyName: string;
}

interface LoginOptionsResponse {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

function browserSupportsPasskeys() {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PasskeySecurityCard({ userEmail }: { userEmail: string }) {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'enroll' | 'verify' | string | null>(null);
  const [friendlyName, setFriendlyName] = useState('');

  const hasPasskeys = credentials.length > 0;
  const passkeySupported = useMemo(() => browserSupportsPasskeys(), []);

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();

    if (!session?.access_token) {
      throw new Error('Please sign in again to manage passkeys.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
  }, []);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/auth/passkeys/me', {
        method: 'GET',
        headers,
      });
      const payload = (await response.json()) as { credentials?: PasskeyCredential[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not load passkeys');
      }
      setCredentials(payload.credentials || []);
    } catch (error) {
      console.error('[Passkeys] Failed to load credentials', error);
      const message = error instanceof Error ? error.message : 'Could not load passkeys';
      toast.error(message);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const enrollPasskey = async () => {
    if (!passkeySupported) {
      toast.error('This browser does not support passkeys.');
      return;
    }

    setActionLoading('enroll');
    try {
      const headers = await getAuthHeaders();
      const optionsResponse = await fetch('/api/auth/passkeys/register-options', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          friendlyName: friendlyName.trim() || undefined,
        }),
      });

      const optionsPayload = (await optionsResponse.json()) as RegisterOptionsResponse & { error?: string };
      if (!optionsResponse.ok) {
        throw new Error(optionsPayload.error || 'Could not initialize passkey registration');
      }

      const registrationResponse = await startRegistration({
        optionsJSON: optionsPayload.options,
      });

      const verifyResponse = await fetch('/api/auth/passkeys/register-verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          challengeId: optionsPayload.challengeId,
          response: registrationResponse,
          friendlyName: optionsPayload.friendlyName,
        }),
      });

      const verifyPayload = (await verifyResponse.json()) as { success?: boolean; error?: string };
      if (!verifyResponse.ok || !verifyPayload.success) {
        throw new Error(verifyPayload.error || 'Could not verify passkey');
      }

      setFriendlyName('');
      toast.success('Passkey registered.');
      await loadCredentials();
    } catch (error) {
      console.error('[Passkeys] Enrollment failed', error);
      const message = error instanceof Error ? error.message : 'Passkey registration failed';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const verifyPasskey = async () => {
    if (!passkeySupported) {
      toast.error('This browser does not support passkeys.');
      return;
    }

    setActionLoading('verify');
    try {
      const optionsResponse = await fetch('/api/auth/passkeys/login-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const optionsPayload = (await optionsResponse.json()) as LoginOptionsResponse & { error?: string };
      if (!optionsResponse.ok) {
        throw new Error(optionsPayload.error || 'Could not initialize passkey verification');
      }

      const authenticationResponse = await startAuthentication({
        optionsJSON: optionsPayload.options,
      });

      const verifyResponse = await fetch('/api/auth/passkeys/login-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          challengeId: optionsPayload.challengeId,
          response: authenticationResponse,
        }),
      });

      const verifyPayload = (await verifyResponse.json()) as {
        success?: boolean;
        accessToken?: string;
        refreshToken?: string;
        error?: string;
      };

      if (!verifyResponse.ok || !verifyPayload.success || !verifyPayload.accessToken || !verifyPayload.refreshToken) {
        throw new Error(verifyPayload.error || 'Passkey verification failed');
      }

      const { error: sessionError } = await getSupabase().auth.setSession({
        access_token: verifyPayload.accessToken,
        refresh_token: verifyPayload.refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      toast.success('Passkey verified.');
      await loadCredentials();
    } catch (error) {
      console.error('[Passkeys] Verification failed', error);
      const message = error instanceof Error ? error.message : 'Passkey verification failed';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const removePasskey = async (credentialId: string) => {
    setActionLoading(credentialId);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/auth/passkeys/me', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ credentialId }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Could not remove passkey');
      }

      toast.success('Passkey removed.');
      await loadCredentials();
    } catch (error) {
      console.error('[Passkeys] Removal failed', error);
      const message = error instanceof Error ? error.message : 'Could not remove passkey';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-[19px] font-semibold text-foreground flex items-center gap-2">
        <ShieldCheck size={20} className="text-sage-500" />
        Security
      </h3>
      <div className="p-5 bg-white rounded-xl border border-cream-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-ocean-50 text-ocean-600 flex items-center justify-center flex-shrink-0">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="text-body font-semibold text-foreground">Passkey login</p>
            <p className="text-[13px] text-muted-foreground">
              Register a passkey for faster, phishing-resistant sign-in on this device.
            </p>
          </div>
        </div>

        {!passkeySupported && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
            Passkeys are not supported in this browser.
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="passkey-name">Passkey label (optional)</Label>
          <Input
            id="passkey-name"
            value={friendlyName}
            onChange={(event) => setFriendlyName(event.target.value)}
            placeholder="e.g. Mariana's iPhone"
            className="bg-cream-50 border-cream-200"
            maxLength={64}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={enrollPasskey} disabled={!passkeySupported || actionLoading !== null}>
            {actionLoading === 'enroll' ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              'Register passkey'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={verifyPasskey}
            disabled={!passkeySupported || !hasPasskeys || actionLoading !== null}
            className="border-cream-300"
          >
            {actionLoading === 'verify' ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify passkey'
            )}
          </Button>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <p className="text-[13px] text-muted-foreground">Loading passkeys...</p>
          ) : credentials.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No passkeys registered yet.
            </p>
          ) : (
            credentials.map((credential) => (
              <article
                key={credential.credentialId}
                className="rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">
                    {credential.friendlyName || 'Calvia Passkey'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Added {formatDate(credential.createdAt)} • Last used {formatDate(credential.lastUsedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePasskey(credential.credentialId)}
                  disabled={actionLoading !== null}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove passkey"
                >
                  {actionLoading === credential.credentialId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
