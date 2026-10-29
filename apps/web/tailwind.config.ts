import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lernivox: {
          cream: '#FAF7F2',
          'cream-light': '#FDFBF7',
          forest: '#14261D',
          'forest-light': '#1F382C',
          'forest-muted': '#4C5952',
          terracotta: '#C25E3B',
          'terracotta-hover': '#AC4F2F',
          peach: '#FBE9DD',
          'peach-light': '#FEF5EE',
          stone: '#EBE5DA',
          'stone-light': '#F4EFEA',
          sage: '#D8E6A2',
          sky: '#CCE2F5',
        },
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-instrument)', 'var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      maxWidth: {
        'wide': '1440px',
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(20, 38, 29, 0.04)',
        'card': '0 12px 32px -4px rgba(20, 38, 29, 0.05), 0 4px 12px -2px rgba(20, 38, 29, 0.02)',
        'card-hover': '0 22px 48px -6px rgba(20, 38, 29, 0.09), 0 8px 18px -2px rgba(20, 38, 29, 0.03)',
        'pill': '0 2px 8px rgba(20, 38, 29, 0.04)',
        'glow-terracotta': '0 12px 28px -6px rgba(194, 94, 59, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
