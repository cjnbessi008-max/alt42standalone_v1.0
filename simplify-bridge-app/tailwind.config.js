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
        'kaist-light': '#E8F4F8',
      },
    },
  },
  plugins: [],
}
