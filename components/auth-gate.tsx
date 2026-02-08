'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthForm } from '@/app/(main)/profile/auth-form';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-14 w-40 mx-auto rounded-xl" />
          <Skeleton className="h-8 w-56 mx-auto rounded-lg" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-5 py-10">
          <AuthForm />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
