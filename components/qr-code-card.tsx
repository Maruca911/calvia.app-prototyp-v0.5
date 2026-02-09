'use client';

import { ScanLine, Info } from 'lucide-react';

interface QRCodeCardProps {
  qrToken: string;
  userName: string;
}

function QRPlaceholder() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="QR code placeholder - scanning functionality coming soon"
    >
      <rect width="180" height="180" fill="white" />
      <rect x="12" y="12" width="48" height="48" rx="4" stroke="#003366" strokeWidth="6" fill="none" />
      <rect x="24" y="24" width="24" height="24" rx="2" fill="#003366" />
      <rect x="120" y="12" width="48" height="48" rx="4" stroke="#003366" strokeWidth="6" fill="none" />
      <rect x="132" y="24" width="24" height="24" rx="2" fill="#003366" />
      <rect x="12" y="120" width="48" height="48" rx="4" stroke="#003366" strokeWidth="6" fill="none" />
      <rect x="24" y="132" width="24" height="24" rx="2" fill="#003366" />
      <rect x="72" y="12" width="8" height="8" fill="#003366" />
      <rect x="72" y="28" width="8" height="8" fill="#003366" />
      <rect x="88" y="12" width="8" height="8" fill="#003366" />
      <rect x="100" y="28" width="8" height="8" fill="#003366" />
      <rect x="72" y="44" width="8" height="8" fill="#003366" />
      <rect x="88" y="36" width="8" height="8" fill="#003366" />
      <rect x="100" y="44" width="8" height="8" fill="#003366" />
      <rect x="12" y="72" width="8" height="8" fill="#003366" />
      <rect x="28" y="80" width="8" height="8" fill="#003366" />
      <rect x="44" y="72" width="8" height="8" fill="#003366" />
      <rect x="12" y="96" width="8" height="8" fill="#003366" />
      <rect x="36" y="96" width="8" height="8" fill="#003366" />
      <rect x="72" y="72" width="8" height="8" fill="#003366" />
      <rect x="88" y="80" width="8" height="8" fill="#003366" />
      <rect x="72" y="96" width="8" height="8" fill="#003366" />
      <rect x="96" y="96" width="8" height="8" fill="#003366" />
      <rect x="120" y="72" width="8" height="8" fill="#003366" />
      <rect x="144" y="80" width="8" height="8" fill="#003366" />
      <rect x="160" y="72" width="8" height="8" fill="#003366" />
      <rect x="128" y="96" width="8" height="8" fill="#003366" />
      <rect x="152" y="96" width="8" height="8" fill="#003366" />
      <rect x="72" y="120" width="8" height="8" fill="#003366" />
      <rect x="88" y="128" width="8" height="8" fill="#003366" />
      <rect x="96" y="144" width="8" height="8" fill="#003366" />
      <rect x="72" y="160" width="8" height="8" fill="#003366" />
      <rect x="120" y="120" width="8" height="8" fill="#003366" />
      <rect x="144" y="128" width="8" height="8" fill="#003366" />
      <rect x="120" y="144" width="8" height="8" fill="#003366" />
      <rect x="160" y="144" width="8" height="8" fill="#003366" />
      <rect x="136" y="160" width="8" height="8" fill="#003366" />
      <rect x="160" y="160" width="8" height="8" fill="#003366" />
    </svg>
  );
}

export function QRCodeCard({ qrToken, userName }: QRCodeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-ocean-500 to-ocean-400 px-5 py-3.5">
        <div className="flex items-center gap-2 text-white">
          <ScanLine size={18} />
          <h4 className="text-[15px] font-semibold">Store Check-in QR Code</h4>
        </div>
      </div>

      <div className="flex flex-col items-center py-6 px-5">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-cream-200">
          <QRPlaceholder />
        </div>

        <p className="mt-4 text-[15px] font-semibold text-foreground">
          {userName}
        </p>
        <p className="text-[13px] text-muted-foreground font-mono tracking-wider mt-1">
          {qrToken}
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-start gap-2.5 p-3.5 bg-sage-50 rounded-lg">
          <Info size={16} className="text-sage-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-sage-700 leading-relaxed">
            Show this code at participating businesses in Calvia.
            Each verified visit earns you points toward your next loyalty tier.
          </p>
        </div>
      </div>
    </div>
  );
}
