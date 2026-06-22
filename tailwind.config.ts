import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11100E",
        paper: "#F4E8DC",
        blue: "#356FE8",
        peach: "#FFB894",
      },
      fontFamily: {
        sans: ["Arial", '"Noto Sans SC"', "sans-serif"],
        display: ['"Arial Black"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
