'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Mail, User, Phone, Chrome, Apple, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { CalviaLogo } from '@/components/calvia-logo';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (!consentGiven) {
        toast.error('Please accept the privacy policy to continue');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error);
      } else {
        if (phone.trim()) {
          const { data: { user } } = await getSupabase().auth.getUser();
          if (user) {
            await getSupabase()
              .from('profiles')
              .update({ phone_number: phone.trim() })
              .eq('id', user.id);
          }
        }
        toast.success('Welcome to Calvia!', {
          description: 'Your account has been created.',
        });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <CalviaLogo size={56} />
        </div>
        <h1 className="text-heading-lg font-semibold text-foreground">
          {mode === 'signin' ? 'Welcome Back' : 'Join Calvia'}
        </h1>
        <p className="text-body text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to access your member profile'
            : 'Your premium guide to life in southwest Mallorca'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-body font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-12 min-h-[56px] bg-white border-cream-300 text-body rounded-lg"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-body font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 min-h-[56px] bg-white border-cream-300 text-body rounded-lg"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-body font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 min-h-[56px] bg-white border-cream-300 text-body rounded-lg"
              required
              minLength={6}
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-body font-medium">
              Phone Number
              <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12 min-h-[56px] bg-white border-cream-300 text-body rounded-lg"
              />
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed pl-1">
              We may contact you for early access when our native app launches.
            </p>
          </div>
        )}

        {mode === 'signin' && (
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="stay-logged-in"
              checked={stayLoggedIn}
              onCheckedChange={(checked) => setStayLoggedIn(checked === true)}
            />
            <label htmlFor="stay-logged-in" className="text-[15px] text-foreground cursor-pointer select-none">
              Stay logged in
            </label>
          </div>
        )}

        {mode === 'signup' && (
          <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-[14px] text-foreground leading-relaxed cursor-pointer select-none">
                I agree to the{' '}
                <a href="/privacy" className="text-ocean-500 font-medium hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" className="text-ocean-500 font-medium hover:underline">
                  Terms of Service
                </a>
                . I consent to the processing of my personal data as described therein.
              </label>
            </div>
            <div className="flex items-start gap-2 pl-7">
              <Shield size={13} className="text-sage-600 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                GDPR compliant. Your data is stored securely in the EU. You can request
                deletion at any time. We will never share your personal data with third
                parties without your explicit consent.
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || (mode === 'signup' && !consentGiven)}
          className="w-full min-h-[58px] text-[19px]"
        >
          {loading
            ? 'Please wait...'
            : mode === 'signin'
            ? 'Sign In'
            : 'Create Account'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-body text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          disabled
          variant="outline"
          className="w-full min-h-[56px] border-cream-300 text-muted-foreground opacity-60 text-body"
        >
          <Chrome size={20} className="mr-2" />
          Google
          <span className="ml-auto text-[13px] font-medium bg-cream-200 px-2.5 py-1 rounded-full">
            Coming Soon
          </span>
        </Button>
        <Button
          disabled
          variant="outline"
          className="w-full min-h-[56px] border-cream-300 text-muted-foreground opacity-60 text-body"
        >
          <Apple size={20} className="mr-2" />
          Apple
          <span className="ml-auto text-[13px] font-medium bg-cream-200 px-2.5 py-1 rounded-full">
            Coming Soon
          </span>
        </Button>
      </div>

      <p className="text-center text-body text-muted-foreground">
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('signin')}
              className="text-ocean-500 font-semibold hover:underline"
            >
              Sign In
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-ocean-500 font-semibold hover:underline"
            >
              Sign Up
            </button>
          </>
        )}
      </p>

      <p className="text-center text-[12px] text-muted-foreground/70 leading-relaxed px-4 pb-2">
        Calvia App operates under EU/Spanish law. By using this service you acknowledge our compliance
        with RGPD (Reglamento General de Protecci&oacute;n de Datos) and LSSI-CE.
      </p>
    </div>
  );
}
