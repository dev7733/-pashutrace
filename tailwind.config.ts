import type { Config } from 'tailwindcss';

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        surface2: c('surface2'),
        line: c('line'),
        ink: c('ink'),
        muted: c('muted'),
        brand: c('brand'),
        'brand-fg': c('brand-fg'),
        accent: c('accent'),
        danger: c('danger'),
        info: c('info'),
        ok: c('ok'),
        warn: c('warn'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces Variable"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)',
        pop: '0 24px 60px -20px rgb(0 0 0 / 0.35)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: '.6' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        flow: { '0%': { strokeDashoffset: '24' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        rise: 'rise .45s ease both',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        flow: 'flow 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
