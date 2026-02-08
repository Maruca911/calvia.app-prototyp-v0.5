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
          50: '#e6edf5',
          100: '#b3c9de',
          200: '#80a5c7',
          300: '#4d81b0',
          400: '#1a5d99',
          500: '#003366',
          600: '#002952',
          700: '#001f3d',
          800: '#001429',
          900: '#000a14',
        },
        sage: {
          50: '#f0f8f3',
          100: '#d4eddc',
          200: '#b8e2c5',
          300: '#A8D5BA',
          400: '#8ac9a5',
          500: '#6cbd90',
          600: '#56a77a',
          700: '#418163',
          800: '#2c5b4d',
          900: '#173536',
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
