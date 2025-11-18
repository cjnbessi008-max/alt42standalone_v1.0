/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        concept: '#4CAF50',
        problem: '#2196F3',
      },
    },
  },
  plugins: [],
}
