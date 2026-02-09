'use client';

import { useState } from 'react';
import { ConciergeRequest } from './concierge-content';
import {
  UtensilsCrossed,
  Car,
  AlertTriangle,
  Lightbulb,
  PenLine,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

const TYPE_LABELS: Record<string, { label: string; icon: typeof UtensilsCrossed }> = {
  restaurant_booking: { label: 'Restaurant Booking', icon: UtensilsCrossed },
  taxi_transfer: { label: 'Taxi / Transfer', icon: Car },
  recommendation: { label: 'Recommendation', icon: Lightbulb },
  report_issue: { label: 'Issue Report', icon: AlertTriangle },
  custom_request: { label: 'Custom Request', icon: PenLine },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'text-ocean-500 bg-ocean-50' },
  acknowledged: { label: 'Acknowledged', icon: Eye, className: 'text-sage-600 bg-sage-50' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'text-sage-600 bg-sage-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-muted-foreground bg-cream-100' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDetailKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function RequestHistory({ requests }: { requests: ConciergeRequest[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {requests.map((req) => {
        const typeInfo = TYPE_LABELS[req.request_type] || TYPE_LABELS.custom_request;
        const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
        const Icon = typeInfo.icon;
        const StatusIcon = statusInfo.icon;
        const isExpanded = expandedId === req.id;
        const details = req.details || {};
        const detailEntries = Object.entries(details).filter(([, v]) => v && String(v).trim().length > 0);

        return (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : req.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
                <Icon size={17} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {typeInfo.label}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.className}`}>
                    <StatusIcon size={11} />
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[13px] font-mono text-muted-foreground">
                    {req.reference_number}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(req.created_at)}
                  </span>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && detailEntries.length > 0 && (
              <div className="px-4 pb-4 border-t border-cream-100 pt-3">
                <div className="space-y-2">
                  {detailEntries.map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                        {formatDetailKey(key)}
                      </p>
                      <p className="text-[15px] text-foreground mt-0.5">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
