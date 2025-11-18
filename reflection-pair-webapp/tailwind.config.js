/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'exponential': '#ff6b6b',
        'logarithmic': '#4ecdc4',
        'reflection': '#ffd93d',
        'phone-frame': '#2c2c2c',
        'phone-screen': '#1a1a1a',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}
