/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          grass: '#7EC850',
          soil: '#8B4513',
          sky: '#87CEEB',
          sun: '#FFD700',
          flower: {
            red: '#FF6B6B',
            blue: '#4ECDC4',
            yellow: '#FFE66D',
            purple: '#A06CD5',
            pink: '#FF85B3'
          }
        },
        phone: {
          frame: '#1F2937',
          screen: '#111827'
        }
      },
      borderRadius: {
        'phone': '2.5rem',
      },
      boxShadow: {
        'phone': '0 10px 40px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
