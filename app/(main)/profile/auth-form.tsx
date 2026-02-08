'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, User, Chrome, Apple } from 'lucide-react';
import { toast } from 'sonner';
import { CalviaLogo } from '@/components/calvia-logo';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error);
      } else {
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
      <div className="text-center space-y-3 pt-2">
        <div className="flex justify-center">
          <CalviaLogo size={48} />
        </div>
        <h1 className="text-heading font-semibold text-foreground">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-body-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to access your concierge profile'
            : 'Join the Calvia community in Mallorca'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-body-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 min-h-[52px] bg-white border-cream-300 text-body-sm"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-body-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 min-h-[52px] bg-white border-cream-300 text-body-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-body-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 min-h-[52px] bg-white border-cream-300 text-body-sm"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-ocean-500 hover:bg-ocean-600 text-white min-h-[52px] text-body font-semibold"
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
          <span className="bg-background px-3 text-body-sm text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <Button
          disabled
          variant="outline"
          className="w-full min-h-[52px] border-cream-300 text-muted-foreground opacity-60 text-body-sm"
        >
          <Chrome size={18} className="mr-2" />
          Google
          <span className="ml-auto text-[11px] font-medium bg-cream-200 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </Button>
        <Button
          disabled
          variant="outline"
          className="w-full min-h-[52px] border-cream-300 text-muted-foreground opacity-60 text-body-sm"
        >
          <Apple size={18} className="mr-2" />
          Apple
          <span className="ml-auto text-[11px] font-medium bg-cream-200 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </Button>
      </div>

      <p className="text-center text-body-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-ocean-500 font-semibold hover:underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('signin')}
              className="text-ocean-500 font-semibold hover:underline"
            >
              Sign In
            </button>
          </>
        )}
      </p>
    </div>
  );
}
