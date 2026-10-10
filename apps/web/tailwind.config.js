/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        paper: 'var(--paper)',
        card: 'var(--card)',
        'card-top': 'var(--card-top)',
        ink: 'var(--ink)',
        mut: 'var(--mut)',
        sub: 'var(--sub)',
        brd: 'var(--brd)',
        'brd-h': 'var(--brd-h)',
        acc: 'var(--acc)',
        go: 'var(--go)',
        ask: 'var(--ask)',
        stop: 'var(--stop)',
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
          '0%, 100%': { opacity: 0.9, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
};
