// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "#3F88C5",   // blue highlight
        accent: "#5CAD7F",  // green buttons
        ink: "#050A0F",     // deep dark text / dark background
        surface: "#FFFFFF", // main light background
      },
    },
  },
  plugins: [],
};
