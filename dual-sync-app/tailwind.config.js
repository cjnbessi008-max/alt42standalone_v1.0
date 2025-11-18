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
        'phone-frame': '#2d2d2d',
      },
      aspectRatio: {
        'phone': '9 / 16',
      },
    },
  },
  plugins: [],
}
