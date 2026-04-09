import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          500: "#4c6ef5",
          600: "#3b5bdb",
          700: "#364fc7",
        },
        priority: {
          low: "#51cf66",
          high: "#fcc419",
          urgent: "#ff6b6b",
        },
      },
      animation: {
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        slideLeft: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-120%) rotate(-15deg)", opacity: "0" },
        },
        slideRight: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(120%) rotate(15deg)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
