'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MainError]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-[22px] font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            This page could not be loaded. Please try again or go back to the home page.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-3 bg-ocean-500 text-white rounded-xl font-semibold text-[15px] hover:bg-ocean-600 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-cream-300 text-foreground rounded-xl font-semibold text-[15px] hover:bg-cream-50 transition-colors"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
