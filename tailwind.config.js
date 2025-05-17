/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)'],
        tomorrow: ['var(--font-tomorrow)'],
        josefin: ['var(--font-josefin)'],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}

