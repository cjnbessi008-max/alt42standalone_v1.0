/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'phone-frame': '#1a1a1a',
        'phone-screen': '#0a0a0a',
      },
    },
  },
  plugins: [],
}
