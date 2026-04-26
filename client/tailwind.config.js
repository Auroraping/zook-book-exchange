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
          blue: '#1a73e8', // Google Blue
          red: '#ea4335',  // Google Red
          yellow: '#fbbc04', // Google Yellow
          green: '#34a853', // Google Green
          gray: '#5f6368',
          'light-blue': '#e8f0fe',
          surface: '#f8f9fa',
          border: '#dadce0',
          'on-surface': '#1f1f1f'
        },
        m3: {
          'primary': '#1a73e8', // Classic Google Blue
          'on-primary': '#ffffff',
          'primary-container': '#e8f0fe',
          'on-primary-container': '#174ea6',
          'secondary': '#5f6368',
          'on-secondary': '#ffffff',
          'secondary-container': '#f1f3f4',
          'on-secondary-container': '#202124',
          'tertiary': '#188038', // Google Green
          'on-tertiary': '#ffffff',
          'tertiary-container': '#e6f4ea',
          'on-tertiary-container': '#137333',
          'surface': '#ffffff',
          'surface-variant': '#f8f9fa',
          'on-surface': '#202124',
          'on-surface-variant': '#5f6368',
          'outline': '#dadce0',
          'surface-container-low': '#ffffff',
          'surface-container': '#f8f9fa',
          'surface-container-high': '#f1f3f4',
        },
      },
      borderRadius: {
        'google': '28px',
        'google-md': '16px',
        'google-sm': '12px'
      },
      boxShadow: {
        'google-1': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-2': '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'google-3': '0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px 0 rgba(60,64,67,0.3)',
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Product Sans"', 'Roboto', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
