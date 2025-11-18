/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'logical-and': '#4CAF50',
        'logical-or': '#2196F3',
        'logical-if': '#FF9800',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s linear infinite',
        'connect': 'connect 0.8s ease-in-out',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        },
        connect: {
          '0%': { strokeDasharray: '0, 1000' },
          '100%': { strokeDasharray: '1000, 0' },
        },
      },
    },
  },
  plugins: [],
}
