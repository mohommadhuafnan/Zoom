/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: '#0E71EB',
          orange: '#FF6600',
          dark: '#1a1a1a',
          panel: '#242424',
          bar: '#2d2d2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
