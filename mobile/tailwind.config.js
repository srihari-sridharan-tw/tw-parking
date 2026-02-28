/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        danger: "#EF4444",
        success: "#22C55E",
        warning: "#F59E0B",
      },
    },
  },
  plugins: [],
};
