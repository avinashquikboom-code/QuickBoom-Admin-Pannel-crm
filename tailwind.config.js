/** @type {import('tailwindcss').Config} */
module.exports = {
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
          DEFAULT: '#23C45E', // Primary Brand Color
          dark: '#1AA14D',    // Primary Dark
          light: '#E8F9EE',   // Primary Light
          secondary: '#23C45E',
          accent: '#23C45E',
        },
        slate: {
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          textPrimary: '#111827',
          textSecondary: '#64748B',
          border: '#E5E7EB',
        },
        status: {
          success: '#23C45E',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#64748B',
        },
      },
    },
  },
  plugins: [],
};
