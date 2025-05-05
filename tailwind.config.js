/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          primary: '#8B5A2B',    // Brun som primærfarge
          secondary: '#D4AF37',  // Gull som sekundærfarge
          accent: '#2E8B57',     // Mørkegrønn som aksentfarge
          light: '#F5F5DC',      // Beige som lys farge
          dark: '#3A2F0B',       // Mørk brun som mørk farge
          darker: '#1A1A0A',     // Nesten svart med hint av brun
        }
      },
      fontFamily: {
        medieval: ['MedievalSharp', 'Cinzel', 'serif'],
        fantasy: ['Fondamento', 'Tangerine', 'serif']
      },
      boxShadow: {
        'fantasy': '0 4px 6px -1px rgba(139, 90, 43, 0.5), 0 2px 4px -1px rgba(139, 90, 43, 0.25)',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
} 