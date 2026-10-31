import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '380px',
      },
      colors: {
        lernivox: {
          cream: '#F6F4EE',
          'cream-light': '#FAF8F4',
          forest: '#14261D',
          'forest-light': '#1F382C',
          'forest-muted': '#45564B',
          terracotta: '#E8722C',
          'terracotta-hover': '#D66522',
          green: '#497E64',
          'green-dark': '#1B3428',
          peach: '#F9D8C0',
          'peach-light': '#FEF5EE',
          stone: '#EAE4D3',
          'stone-light': '#F4EFEA',
          sage: '#D6E59A',
          sky: '#C9E0F2',
        },
      },
      fontFamily: {
        sans: ['var(--font-instrument)', 'sans-serif'],
        display: ['var(--font-bricolage)', 'sans-serif'],
        body: ['var(--font-instrument)', 'sans-serif'],
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
