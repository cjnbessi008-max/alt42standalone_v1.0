/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        phone: {
          frame: '#1a1a1a',
          screen: '#ffffff',
          notch: '#0a0a0a',
        },
      },
      boxShadow: {
        phone: '0 20px 50px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
