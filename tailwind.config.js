/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kaist-blue': '#004191',
        'kaist-red': '#E63312',
      },
    },
  },
  plugins: [],
}
