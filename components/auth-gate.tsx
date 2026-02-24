'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CalviaLogo } from '@/components/calvia-logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MapPin, Star, Shield } from 'lucide-react';

const ENTERED_KEY = 'calvia_entered';

export function AuthGate({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(ENTERED_KEY)) {
      setEntered(true);
    }
    setChecking(false);
  }, []);

  const handleEnter = () => {
    localStorage.setItem(ENTERED_KEY, 'true');
    setEntered(true);
  };

  if (checking) {
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

  if (!entered) {
    return <WelcomeGate onEnter={handleEnter} />;
  }

  return <>{children}</>;
}

function WelcomeGate({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-500 via-ocean-400 to-background flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-8 w-64 h-64 rounded-full bg-sage-300 opacity-10 blur-3xl" />
        <div className="absolute bottom-40 left-4 w-48 h-48 rounded-full bg-ocean-200 opacity-10 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-32 h-32 rounded-full bg-sage-200 opacity-8 blur-2xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <CalviaLogo size={64} />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-heading-xl text-white drop-shadow-md">
                Calvia App
              </h1>
              <h2 className="text-heading-sm text-white/90 font-medium drop-shadow-sm">
                The modern yellow pages of southwest Mallorca
              </h2>
              <p className="text-body-sm text-white/80 max-w-xs mx-auto leading-relaxed drop-shadow-sm">
                Your local guide to the best of southwest Mallorca
              </p>
            </div>
          </div>

          <div className="space-y-3 animate-fade-in-delay-1">
            <div className="flex items-center gap-3 text-left bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <MapPin size={20} className="text-sage-300 flex-shrink-0" />
              <span className="text-[15px] text-white/90">Restaurants, shops & services in Calvia</span>
            </div>
            <div className="flex items-center gap-3 text-left bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <Star size={20} className="text-sage-300 flex-shrink-0" />
              <span className="text-[15px] text-white/90">Curated picks from locals who know best</span>
            </div>
            <div className="flex items-center gap-3 text-left bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <Shield size={20} className="text-sage-300 flex-shrink-0" />
              <span className="text-[15px] text-white/90">Free to use, no account required</span>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in-delay-2">
            <Button
              onClick={onEnter}
              className="w-full min-h-[58px] text-[19px] bg-white text-ocean-500 hover:bg-cream-100 shadow-lg"
            >
              Explore Calvia
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <p className="text-[15px] text-white/80">
              Want to save favourites?{' '}
              <button
                onClick={onEnter}
                className="text-white font-semibold hover:underline"
              >
                Register Now for free
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pb-8 pt-4 relative">
        <p className="text-[13px] text-ocean-200">
          calvia.app
        </p>
      </div>
    </div>
  );
}
