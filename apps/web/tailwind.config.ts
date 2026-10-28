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
          cream: '#f4f0e5',
          'cream-light': '#faf7f3',
          forest: '#14261d',
          'forest-light': '#1b3428',
          'forest-muted': '#45564b',
          terracotta: '#e8722c',
          peach: '#f9d8c0',
          stone: '#eae4d3',
        },
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'sans-serif'],
        sans: ['var(--font-instrument)', 'var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
