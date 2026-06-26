/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RihadX Brand Colors
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080d1a',
        },
        accent: {
          cyan:    '#06b6d4',
          violet:  '#8b5cf6',
          emerald: '#10b981',
          rose:    '#f43f5e',
          amber:   '#f59e0b',
        }
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      boxShadow: {
        'glow-brand':   '0 0 20px rgba(99,102,241,0.4)',
        'glow-cyan':    '0 0 20px rgba(6,182,212,0.4)',
        'glow-violet':  '0 0 20px rgba(139,92,246,0.4)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':         '0 4px 24px rgba(0,0,0,0.35)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'slide-in-right':'slideInRight 0.25s ease-out',
        'fade-in':       'fadeIn 0.2s ease-out',
        'scale-in':      'scaleIn 0.15s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)', opacity: 0 },
          to:   { transform: 'translateX(0)',     opacity: 1 },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: 0 },
          to:   { transform: 'translateX(0)',    opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: 0 },
          to:   { transform: 'scale(1)',    opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
