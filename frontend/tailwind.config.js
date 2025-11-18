/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'planet-blue': '#3B82F6',
        'planet-purple': '#8B5CF6',
        'planet-green': '#10B981',
        'planet-yellow': '#F59E0B',
        'planet-orange': '#F97316',
        'planet-red': '#EF4444',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
