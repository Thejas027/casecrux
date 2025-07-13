/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f8f5ff",
          100: "#eee6ff",
          200: "#daccff",
          300: "#c5a3ff",
          400: "#ac76ff",
          500: "#9747ff",
          600: "#8520ff",
          700: "#7611ef",
          800: "#6310c9",
          900: "#530fa2",
          950: "#330975",
        },
        accent: {
          50: "#fef2f9",
          100: "#fde6f4",
          200: "#fecceb",
          300: "#fea3da",
          400: "#fe68c0",
          500: "#f83aaa",
          600: "#e91f8d",
          700: "#ca0e70",
          800: "#a7105d",
          900: "#8a114f",
          950: "#55062e",
        },
      },
    },
  },
  plugins: [],
};
