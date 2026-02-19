import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        ocean: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#014BB5',
          600: '#013d94',
          700: '#012f73',
          800: '#002152',
          900: '#001331',
        },
        sun: {
          50: '#fff5eb',
          100: '#ffe0c2',
          200: '#ffcc99',
          300: '#ffb770',
          400: '#ffa347',
          500: '#FF7402',
          600: '#cc5d02',
          700: '#994601',
          800: '#662f01',
          900: '#331700',
        },
        sand: {
          50: '#FEFCF8',
          100: '#FDF8F0',
          200: '#FAF0E0',
          300: '#F5E6CC',
          400: '#EED9B3',
          500: '#E6CC99',
        },
        sage: {
          50: '#edfbf2',
          100: '#d1f5de',
          200: '#a8ecc0',
          300: '#7de0a3',
          400: '#52d486',
          500: '#34b86a',
          600: '#28a05c',
          700: '#1e7a47',
          800: '#155432',
          900: '#0c2e1d',
        },
        cream: {
          50: '#FDFCFB',
          100: '#F8F6F3',
          200: '#F0EDE8',
          300: '#E8E4DD',
          400: '#D8D2C8',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        'body': ['18px', { lineHeight: '1.5' }],
        'body-sm': ['16px', { lineHeight: '1.5' }],
        'heading-xl': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-lg': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-sm': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
