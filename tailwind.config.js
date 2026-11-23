/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        instrument: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        serifDisplay: ['"Young Serif"', 'Georgia', 'serif'],
      },
      colors: {
        ivory: '#FAF9F6',
        espresso: '#231712',
      },
    },
  },
  plugins: [],
};
