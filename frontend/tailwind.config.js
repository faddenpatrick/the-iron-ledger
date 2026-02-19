/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand colors from The Iron Ledger logo
        primary: {
          50: '#faf8f4',   // Very light gold
          100: '#f5f0e6',
          200: '#ebe0cc',
          300: '#d9c7a3',
          400: '#c9a961',  // Logo gold/brass
          500: '#b8954d',  // Medium gold
          600: '#9a7c3f',  // Dark gold
          700: '#7d6432',  // Deep gold
          800: '#5f4d26',  // Bronze
          900: '#3a2f18',  // Dark bronze
        },
        brand: {
          gold: '#c9a961',    // Scale/brass color
          iron: '#3a3a3a',    // Dark metallic background
          slate: '#4a4a4a',   // Medium metallic
          green: '#7cb342',   // Vegetable green
          check: '#e8e8e8',   // Checkmark color
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
