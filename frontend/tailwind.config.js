/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
        },
        secondary: {
          DEFAULT: '#334155',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
        },
        success: {
          DEFAULT: '#15803D',
          bg: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#B45309',
          bg: '#FEF3C7',
        },
        error: {
          DEFAULT: '#B91C1C',
          bg: '#FEE2E2',
        },
        info: {
          DEFAULT: '#0369A1',
          bg: '#E0F2FE',
        },
        disabled: {
          DEFAULT: '#94A3B8',
          bg: '#F1F5F9',
        }
      }
    },
  },
  plugins: [],
}
