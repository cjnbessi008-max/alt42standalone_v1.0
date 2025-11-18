/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#06B6D4',
        accent: '#F59E0B',
      },
      boxShadow: {
        'phone': '0 20px 50px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
