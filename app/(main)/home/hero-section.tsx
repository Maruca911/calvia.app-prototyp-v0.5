import { CalviaLogo } from '@/components/calvia-logo';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ocean-500 via-ocean-400 to-background px-5 pt-10 pb-14">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-sage-300 blur-3xl" />
        <div className="absolute bottom-8 left-4 w-32 h-32 rounded-full bg-ocean-200 blur-3xl" />
      </div>
      <div className="relative text-center space-y-5">
        <div className="flex justify-center">
          <CalviaLogo size={56} />
        </div>
        <h1 className="text-heading-xl text-white">
          Your Discreet Concierge
        </h1>
        <p className="text-body text-ocean-100 max-w-sm mx-auto leading-relaxed">
          Effortless luxury in Calvia — discover services, save time, and enjoy every moment in paradise.
        </p>
      </div>
    </section>
  );
}
