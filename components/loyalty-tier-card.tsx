'use client';

import { Trophy, Star, Gift, ChevronRight } from 'lucide-react';

interface LoyaltyTierCardProps {
  tier: string;
  points: number;
  visitCount: number;
}

const TIERS = [
  { name: 'Silver', min: 0, max: 500, color: 'from-gray-300 to-gray-400', textColor: 'text-gray-600', discount: '5%' },
  { name: 'Gold', min: 500, max: 1500, color: 'from-amber-300 to-amber-500', textColor: 'text-amber-600', discount: '10%' },
  { name: 'Platinum', min: 1500, max: 3000, color: 'from-ocean-300 to-ocean-500', textColor: 'text-ocean-600', discount: '15%' },
];

export function LoyaltyTierCard({ tier, points, visitCount }: LoyaltyTierCardProps) {
  const currentTier = TIERS.find((t) => t.name === tier) || TIERS[0];
  const currentTierIndex = TIERS.indexOf(currentTier);
  const nextTier = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;
  const progressPercent = nextTier
    ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;
  const pointsToNext = nextTier ? nextTier.min - points : 0;

  return (
    <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${currentTier.color} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Trophy size={20} />
            <span className="text-[17px] font-semibold">
              {currentTier.name} Member
            </span>
          </div>
          <span className="text-white/90 text-[15px] font-semibold">
            {points} pts
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">
                Progress to {nextTier.name}
              </span>
              <span className="font-semibold text-foreground">
                {pointsToNext} pts to go
              </span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${currentTier.color} rounded-full transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {!nextTier && (
          <div className="flex items-center gap-2 p-3 bg-ocean-50 rounded-lg">
            <Star size={16} className="text-ocean-500" />
            <p className="text-[14px] text-ocean-700 font-medium">
              You have reached the highest tier!
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-cream-50 rounded-lg">
            <p className="text-heading-sm font-semibold text-foreground">{visitCount}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Visits</p>
          </div>
          <div className="text-center p-3 bg-cream-50 rounded-lg">
            <p className="text-heading-sm font-semibold text-foreground">{points}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Points</p>
          </div>
          <div className="text-center p-3 bg-cream-50 rounded-lg">
            <p className="text-heading-sm font-semibold text-foreground">{currentTier.discount}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Discount</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[14px] font-semibold text-foreground">Tier Benefits</h4>
          {TIERS.map((t, i) => {
            const isActive = i <= currentTierIndex;
            return (
              <div
                key={t.name}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-sage-50' : 'bg-cream-50 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${t.color} flex items-center justify-center`}>
                  <Gift size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {t.discount} off at participating businesses
                  </p>
                </div>
                {isActive && (
                  <ChevronRight size={14} className="text-sage-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
