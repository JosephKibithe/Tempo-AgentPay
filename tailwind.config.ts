import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        panel: '#050505',
        panelSoft: '#0d0d0d',
        ink: '#f6fff6',
        muted: 'rgba(255,255,255,0.62)',
        line: 'rgba(255,255,255,0.12)',
        accentBlue: '#51a2ff',
        accentGreen: '#00e100',
        accentAmber: '#ffcb00',
        accentRed: '#fb2c36',
      },
      boxShadow: {
        glow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      fontFamily: {
        sans: ['var(--font-space)', 'ui-monospace', 'monospace'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
