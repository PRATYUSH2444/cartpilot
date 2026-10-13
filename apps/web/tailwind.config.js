/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CartPilot design system tokens (static values + CSS-var aliases)
        brand: '#0C5C34',
        'brand-dark': '#43C07D',
        'brand-soft': '#E1F2E7',
        go: '#168A57',
        ask: '#C98A14',
        stop: '#D23F36',
        surface: '#FFFFFF',
        'surface-2': '#EFEDE3',
        ink: '#14201A',
        mut: '#5E6B63',
        line: '#E4E0D3',
        bg: '#F6F4EC',
        // Legacy aliases (mapped to CSS vars so dark mode still works)
        paper: 'var(--bg)',
        card: 'var(--surface)',
        'card-top': 'var(--surface-2)',
        brd: 'var(--line)',
        'brd-h': 'var(--mut)',
        acc: 'var(--brand)',
        sub: 'var(--mut)',
      },
      fontFamily: {
        heading: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body: ['Instrument Sans', 'system-ui', 'sans-serif'],
        // Legacy aliases
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        bubble: '18px',
        chip: '99px',
        input: '14px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(14,20,17,0.07), 0 1px 3px rgba(14,20,17,0.05)',
      },
      animation: {
        'blob-drift-1': 'blobDrift1 20s infinite alternate ease-in-out',
        'blob-drift-2': 'blobDrift2 25s infinite alternate ease-in-out',
        'blob-drift-3': 'blobDrift3 22s infinite alternate ease-in-out',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        blobDrift1: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '100%': { transform: 'translate(40px, 60px) scale(1.1)' },
        },
        blobDrift2: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '100%': { transform: 'translate(-50px, -40px) scale(1.15)' },
        },
        blobDrift3: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '100%': { transform: 'translate(30px, -50px) scale(0.95)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
};
