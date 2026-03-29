/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6fd',
          200: '#b9cefb',
          300: '#87a9f8',
          400: '#547af3',
          500: '#2952ee',
          600: '#1a3fd4',
          700: '#1630ac',
          800: '#162b8c',
          900: '#172870',
          950: '#111846',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
