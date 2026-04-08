/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#121417',
          50: '#181b20',
          100: '#1d2127',
          200: '#252a32',
          300: '#2f3540',
          400: '#3a4350',
        },
        gold: { DEFAULT: '#8b5cf6', light: '#a78bfa', dim: '#7c3aed' },
        accent: { DEFAULT: '#22d3ee', dim: '#06b6d4' },
        success: '#3cc87a',
        danger: '#e05555',
        warn: '#fb923c',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"DM Mono"', 'ui-monospace'],
      },
    },
  },
  plugins: [],
}
