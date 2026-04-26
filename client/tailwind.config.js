/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          red: '#ea4335',
          yellow: '#fbbc04',
          green: '#34a853',
          gray: '#5f6368',
          'light-blue': '#e8f0fe',
          surface: '#f8f9fa',
          border: '#dadce0'
        },
        m3: {
          blue: '#0b57d0',
          'on-blue': '#ffffff',
          'blue-container': '#d3e3fd',
          'on-blue-container': '#041e49',
          surface: '#f8f9fa',
          'surface-container': '#f0f4f8',
          'on-surface': '#1f1f1f',
          outline: '#747775',
          error: '#b3261e'
        },
        zju: {
          blue: '#003F88',
          hover: '#002A66',
          light: '#e6f0fa',
          green: '#10b981',
          gold: '#f59e0b',
        }
      },
      borderRadius: {
        'google': '28px',
        'google-md': '16px',
        'google-sm': '8px'
      },
      boxShadow: {
        'google': '0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149)',
        'google-hover': '0 1px 3px 0 rgba(60,64,67,0.302), 0 4px 8px 3px rgba(60,64,67,0.149)',
      }
    },
  },
  plugins: [],
}
