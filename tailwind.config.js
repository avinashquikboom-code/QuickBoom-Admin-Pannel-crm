/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F766E', // Primary Brand Color
          dark: '#115E59',    // Primary Dark
          light: '#CCFBF1',   // Primary Light
          secondary: '#14B8A6',
          accent: '#2DD4BF',
        },
        slate: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          textPrimary: '#0F172A',
          textSecondary: '#64748B',
          border: '#E2E8F0',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
