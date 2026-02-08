import { CalviaLogo, CalviaWordmark } from '@/components/calvia-logo';

export function TopHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-cream-200">
      <div className="flex items-center gap-2.5 px-5 py-3 max-w-lg mx-auto">
        <CalviaLogo size={28} />
        <CalviaWordmark />
      </div>
    </header>
  );
}
