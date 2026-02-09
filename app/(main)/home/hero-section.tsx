import { CalviaLogo } from '@/components/calvia-logo';

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-ocean-500 via-ocean-400 to-background px-5 pt-10 pb-14"
      aria-label="Welcome to Calvia App"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-sage-300 blur-3xl" />
        <div className="absolute bottom-8 left-4 w-32 h-32 rounded-full bg-ocean-200 blur-3xl" />
      </div>
      <div className="relative text-center space-y-4">
        <div className="flex justify-center" aria-hidden="true">
          <CalviaLogo size={56} />
        </div>
        <h1 className="text-heading-xl text-white drop-shadow-md">
          Calvia App
        </h1>
        <h2 className="text-heading-sm text-white/90 font-medium drop-shadow-sm">
          Your discreet concierge
        </h2>
        <p className="text-body-sm text-white/80 max-w-sm mx-auto leading-relaxed drop-shadow-sm">
          Effortless luxury in Calvia — discover services, save time,
          and enjoy every moment in southwest Mallorca.
        </p>
      </div>
    </section>
  );
}
