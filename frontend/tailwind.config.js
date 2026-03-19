/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0f1117',
          card: '#1a1d2e',
          cardHover: '#222640',
          border: '#2a2d3e',
          accent: '#6366f1',
          accentHover: '#818cf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans KR',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
