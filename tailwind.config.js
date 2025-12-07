/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Futuristic Neon Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        neon: {
          cyan: '#00ffff',
          pink: '#ff007f',
          purple: '#8b5cf6',
          blue: '#0ea5e9',
          green: '#00ff88',
          orange: '#ff8800',
        },
        cyber: {
          dark: '#0a0a0f',
          darker: '#050507',
          light: '#1a1a2e',
          accent: '#16213e',
          glow: '#0f3460',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.1)',
          blur: 'rgba(255, 255, 255, 0.05)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'matrix': 'matrix 20s linear infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite alternate',
        'cyber-grid': 'cyberGrid 4s linear infinite',
        'hologram': 'hologram 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { 
            filter: 'drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor) brightness(1)'
          },
          '100%': { 
            filter: 'drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor) drop-shadow(0 0 15px currentColor) brightness(1.2)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        matrix: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        neonPulse: {
          '0%': { 
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px currentColor',
            opacity: '0.8'
          },
          '100%': { 
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor',
            opacity: '1'
          },
        },
        cyberGrid: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50px)' },
        },
        hologram: {
          '0%, 100%': { 
            filter: 'hue-rotate(0deg) brightness(1)',
            transform: 'scale(1)',
          },
          '50%': { 
            filter: 'hue-rotate(180deg) brightness(1.1)',
            transform: 'scale(1.02)',
          },
        },
      },
    },
  },
  plugins: [],
};
