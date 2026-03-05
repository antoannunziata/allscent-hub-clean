/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#09090f',
        surface: '#111118',
        surface2:'#1a1a24',
        surface3:'#22222f',
        accent:  '#c9a96e',
        accent2: '#e8c990',
        muted:   '#6b6b80',
        muted2:  '#9898a8',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        serif:   ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}
