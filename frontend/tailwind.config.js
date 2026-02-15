/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',   // Light steel
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',  // Medium steel
          500: '#64748b',  // Steel gray
          600: '#475569',  // Dark steel
          700: '#334155',  // Gunmetal
          800: '#1e293b',  // Dark gunmetal
          900: '#0f172a',  // Iron black
        },
        // Macro-specific accent colors
        steel: {
          DEFAULT: '#3b82f6',  // Steel blue for calories
          light: '#60a5fa',
          dark: '#2563eb',
        },
        iron: {
          DEFAULT: '#71717a',  // Zinc/iron gray for protein
          light: '#a1a1aa',
          dark: '#52525b',
        },
        copper: {
          DEFAULT: '#f59e0b',  // Amber/copper for carbs
          light: '#fbbf24',
          dark: '#d97706',
        },
        bronze: {
          DEFAULT: '#92400e',  // Bronze/brown for fat
          light: '#b45309',
          dark: '#78350f',
        },
      },
    },
  },
  plugins: [],
}
