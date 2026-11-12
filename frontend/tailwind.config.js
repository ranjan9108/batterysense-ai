/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#151e32',
          900: '#0b1329',
          950: '#060a17',
        },
        brand: {
          green: '#10b981',
          emerald: '#059669',
          cyan: '#06b6d4',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
