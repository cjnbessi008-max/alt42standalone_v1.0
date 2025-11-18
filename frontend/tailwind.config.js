/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'phone-bg': '#1a1a1a',
        'phone-screen': '#f8f9fa',
      },
      boxShadow: {
        'phone': '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
