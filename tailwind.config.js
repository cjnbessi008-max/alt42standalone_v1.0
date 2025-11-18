/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'moodle-primary': '#f98012',
        'moodle-secondary': '#1177d1',
      },
      boxShadow: {
        'phone': '0 20px 60px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
