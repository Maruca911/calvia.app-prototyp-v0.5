'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, User } from 'lucide-react';

const tabs = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/concierge', label: 'Concierge', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-cream-300 safe-bottom" aria-label="Main navigation">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[64px] min-w-[72px] px-3 py-2 transition-colors ${
                isActive
                  ? 'text-ocean-500'
                  : 'text-muted-foreground hover:text-ocean-300'
              }`}
            >
              <Icon size={26} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
              <span className={`text-[13px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
