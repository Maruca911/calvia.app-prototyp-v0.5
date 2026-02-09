'use client';

import { useState, useEffect } from 'react';
import { CalviaLogo } from '@/components/calvia-logo';
import { MapPin, Sun, Waves, Mountain } from 'lucide-react';

const SCENES = [
  {
    icon: Sun,
    tagline: 'Sun, sea & simplicity',
    description: 'Your premium guide to southwest Mallorca',
  },
  {
    icon: Waves,
    tagline: 'Beach life, elevated',
    description: 'From hidden coves to beach clubs',
  },
  {
    icon: Mountain,
    tagline: 'Adventure awaits',
    description: 'Golf, padel, sailing & more in Calvia',
  },
];

export function HeroSection() {
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scene = SCENES[activeScene];
  const SceneIcon = scene.icon;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-ocean-500 via-ocean-400 to-sage-500 px-5 pt-8 pb-16"
      aria-label="Welcome to Calvia App"
    >
      <div className="absolute inset-0">
        <div className="absolute top-6 right-10 w-48 h-48 rounded-full bg-sage-300/15 blur-3xl" />
        <div className="absolute bottom-4 left-6 w-36 h-36 rounded-full bg-ocean-200/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative text-center space-y-5">
        <div className="flex justify-center" aria-hidden="true">
          <div className="relative">
            <CalviaLogo size={52} />
            <div className="absolute -inset-3 rounded-full bg-white/10 blur-sm -z-10" />
          </div>
        </div>

        <div>
          <h1 className="text-heading-xl text-white drop-shadow-md tracking-tight">
            Calvia App
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <MapPin size={14} className="text-sage-200" />
            <span className="text-[14px] text-sage-200 font-medium tracking-wide">
              Southwest Mallorca
            </span>
          </div>
        </div>

        <div className="min-h-[68px] flex flex-col items-center justify-center">
          <div
            key={activeScene}
            className="flex flex-col items-center gap-2 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <SceneIcon size={18} className="text-sage-200" />
              <h2 className="text-heading-sm text-white/95 font-medium drop-shadow-sm">
                {scene.tagline}
              </h2>
            </div>
            <p className="text-body-sm text-white/75 max-w-xs mx-auto leading-relaxed">
              {scene.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          {SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveScene(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeScene
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
