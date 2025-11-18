/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kaist-blue': '#004098',
        'kaist-navy': '#003865',
      },
    },
  },
  plugins: [],
}
