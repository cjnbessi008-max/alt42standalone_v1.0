/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e1fd',
          300: '#b3c9fb',
          400: '#8aa7f7',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4595',
          900: '#333d7a',
        },
        secondary: {
          50: '#fff5f0',
          100: '#ffe8dd',
          200: '#ffd1bb',
          300: '#ffb088',
          400: '#ff8855',
          500: '#ff6600',
          600: '#e65c00',
          700: '#cc5200',
          800: '#b34800',
          900: '#993e00',
        },
      },
      animation: {
        'thermometer-fill': 'fill 0.5s ease-in-out',
      },
      keyframes: {
        fill: {
          '0%': { height: '0%' },
          '100%': { height: 'var(--fill-height)' },
        },
      },
    },
  },
  plugins: [],
};
