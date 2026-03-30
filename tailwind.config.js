/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a1228',
          50: '#0d1835',
          100: '#101e3c',
          200: '#162444',
          300: '#1c3060',
          400: '#243a72',
        },
        gold: { DEFAULT: '#f5c518', light: '#ffd740', dim: '#c9a020' },
        accent: { DEFAULT: '#50c8f0', dim: '#3a9ab8' },
        success: '#3cc87a',
        danger: '#e05555',
        warn: '#f5a623',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"DM Mono"', 'ui-monospace'],
      },
    },
  },
  plugins: [],
}
