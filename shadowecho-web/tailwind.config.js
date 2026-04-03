/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#03070f',
          card: '#060e1a',
          elevated: '#0a1525',
          border: '#0f2034',
        },
        accent: {
          cyan: '#00c8f0',
          red: '#f0263e',
          amber: '#f07020',
          green: '#00e87a',
          purple: '#9b6dff',
        },
        text: {
          primary: '#d0e8ff',
          secondary: '#5a8ab0',
          muted: '#263d52',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
