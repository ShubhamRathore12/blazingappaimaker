/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f5ff', 100: '#e0ebff', 200: '#c0d6ff', 300: '#91b5ff', 400: '#608aff', 500: '#3b5eff', 600: '#2340f5', 700: '#1a2fe1', 800: '#1c2ab6', 900: '#1d2a8f' },
        dark: { 50: '#f6f6f9', 100: '#ececf1', 200: '#d5d5e0', 300: '#b1b1c5', 400: '#8787a5', 500: '#68688a', 600: '#535372', 700: '#44445d', 800: '#3a3a4e', 900: '#1e1e2e', 950: '#14141f' },
      },
    },
  },
  plugins: [],
};
