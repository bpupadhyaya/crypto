/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Open Wallet design system — matches bpupadhyaya.github.io
        bg: {
          primary: '#0a0a0f',
          secondary: '#111118',
          card: '#16161f',
          'card-hover': '#1c1c28',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#a0a0b0',
          muted: '#606070',
        },
        accent: {
          green: '#22c55e',
          orange: '#f97316',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
