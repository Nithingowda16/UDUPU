/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: {
            light: '#F5F5F7',
            dark: '#000000'
          },
          card: {
            light: '#FFFFFF',
            dark: '#1D1D1F'
          },
          text: {
            primary: {
              light: '#1D1D1F',
              dark: '#F5F5F7'
            },
            secondary: {
              light: '#6E6E73',
              dark: '#86868B'
            }
          },
          accent: '#0071E3',
          border: {
            light: '#E5E5E7',
            dark: '#2D2D2F'
          }
        }
      },
      fontFamily: {
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'premium-hover': '0 20px 40px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
}
