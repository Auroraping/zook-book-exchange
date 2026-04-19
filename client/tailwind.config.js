/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zju: {
          blue: '#003F88',
          hover: '#002A66',
          light: '#e6f0fa',
          green: '#10b981',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
