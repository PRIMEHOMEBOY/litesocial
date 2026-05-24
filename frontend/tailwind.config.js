/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#080808',
        surface: '#0d0d0d',
        elevated: '#111111',
        border: '#1a1a1a',
        'border-hover': '#2a2a2a',
        primary: '#ffffff',
        secondary: '#888888',
        muted: '#444444',
        purple: '#9b63ff',
        green: '#7ee8a2',
        orange: '#f7931a',
        red: '#ff6b9d',
      },
      fontFamily: {
        display: ['Space Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        tag: '8px',
      },
    },
  },
  plugins: [],
}
