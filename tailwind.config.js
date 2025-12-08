/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#22c55e', // green for titles
        background: '#1f2937', // dark gray background
        card: '#374151', // slightly lighter for inputs/cards
      },
    },
  },
  plugins: [],
}