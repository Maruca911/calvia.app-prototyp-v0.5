'use client';

import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

export function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone;
    const dismissed = sessionStorage.getItem('ios-prompt-dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('ios-prompt-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-cream-300 p-4 animate-fade-in max-w-lg mx-auto">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-lg bg-ocean-500 flex items-center justify-center flex-shrink-0">
          <Share size={18} className="text-white" />
        </div>
        <div>
          <p className="text-body-sm font-semibold text-foreground">
            Add Calvia to Home Screen
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Tap the share button in Safari, then &ldquo;Add to Home Screen&rdquo; for the full app experience.
          </p>
        </div>
      </div>
    </div>
  );
}
