const { HOGU_COLORS } = require("./src/config/theme.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // ====== CLASSI STATICHE PER OGNI COLORE HOGU ======
    // Primary
    "text-[#68B49B]",
    "bg-[#68B49B]",
    "border-[#68B49B]",
    "ring-[#68B49B]",
    "focus:ring-[#68B49B]",

    // PrimaryHeroCTA
    "text-[#33594C]",
    "bg-[#33594C]",
    "border-[#33594C]",
    "ring-[#33594C]",
    "focus:ring-[#33594C]",

    // Dark
    "text-[#1A202C]",
    "bg-[#1A202C]",
    "border-[#1A202C]",
    "ring-[#1A202C]",
    "focus:ring-[#1A202C]",

    // LightAccent
    "text-[#E6F5F0]",
    "bg-[#E6F5F0]",
    "border-[#E6F5F0]",
    "ring-[#E6F5F0]",
    "focus:ring-[#E6F5F0]",

    // SubtleText
    "text-[#4A5568]",
    "bg-[#4A5568]",
    "border-[#4A5568]",
    "ring-[#4A5568]",
    "focus:ring-[#4A5568]",

    // Success
    "text-[#009900]",
    "bg-[#009900]",
    "border-[#009900]",
    "ring-[#009900]",
    "focus:ring-[#009900]",

    // LightGray
    "text-[#E9EBF1]",
    "bg-[#E9EBF1]",
    "border-[#E9EBF1]",
    "ring-[#E9EBF1]",
    "focus:ring-[#E9EBF1]",

    // WidgetDark
    "text-[#1E293B]",
    "bg-[#1E293B]",
    "border-[#1E293B]",
    "ring-[#1E293B]",
    "focus:ring-[#1E293B]",

    // ====== CLASSI DI DINAMICHE NON COLORI ======
    { pattern: /drop-shadow-md/ },
    { pattern: /drop-shadow-lg/ },
    { pattern: /shadow-xl/ },
    { pattern: /shadow-2xl/ },
    { pattern: /shadow-inner/ },
    { pattern: /shadow-\[.+\]/ },
    { pattern: /hover:scale-\[\d(\.\d+)?\]/ },
  ],
  theme: {
    extend: {
      colors: HOGU_COLORS,
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
