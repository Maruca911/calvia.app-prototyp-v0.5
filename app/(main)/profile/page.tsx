'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthForm } from './auth-form';
import { ProfileView } from './profile-view';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="px-5 py-8 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 animate-fade-in">
      {user ? <ProfileView user={user} /> : <AuthForm />}
    </div>
  );
}
