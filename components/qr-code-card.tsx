'use client';

import { QRCodeSVG } from 'qrcode.react';
import { ScanLine, Info } from 'lucide-react';

interface QRCodeCardProps {
  qrToken: string;
  userName: string;
}

export function QRCodeCard({ qrToken, userName }: QRCodeCardProps) {
  const verifyUrl = `https://calvia.app/verify/${qrToken}`;

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
          <QRCodeSVG
            value={verifyUrl}
            size={180}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#003366"
            includeMargin={false}
          />
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
