'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-[22px] font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            We could not load this page. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-500 text-white rounded-xl font-semibold text-[15px] hover:bg-ocean-600 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
