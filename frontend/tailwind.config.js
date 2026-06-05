/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090D1A',
          card: 'rgba(22, 28, 45, 0.65)',
          cardMuted: 'rgba(30, 41, 59, 0.4)',
          border: 'rgba(255, 255, 255, 0.06)',
          text: '#F8FAFC',
          muted: '#94A3B8'
        },
        brand: {
          primary: '#4F46E5', // Indigo
          secondary: '#06B6D4', // Cyan
          accent: '#D946EF', // Fuchsia
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(79, 70, 229, 0.15)',
      }
    },
  },
  plugins: [],
}
