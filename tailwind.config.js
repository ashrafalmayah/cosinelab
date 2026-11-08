/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        emeraldLab: {
          50: '#f2f8f7',
          100: '#ddeeeB',
          200: '#bce0da',
          300: '#8fc9c0',
          400: '#60aba1',
          500: '#428f85',
          600: '#32726a',
          700: '#295b56',
          800: '#1E3A3A',
          900: '#162c2c',
        },
        goldLab: {
          50: '#fbf8f1',
          100: '#f5eedb',
          200: '#eadab5',
          300: '#dcc088',
          400: '#cfa35c',
          500: '#c48b3b',
          600: '#b2722f',
          700: '#935828',
          800: '#784726',
          900: '#633b22',
        }
      }
    },
  },
  plugins: [],
}

