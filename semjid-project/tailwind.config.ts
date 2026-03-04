import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT:  "#0d7377",
          dark:     "#0a5559",
          light:    "#14a8ae",
        },
        gold: {
          DEFAULT:  "#c9a53e",
          light:    "#e0c060",
        },
        cream:  "#f8fbfd",
        snow:   "#ffffff",
        muted:  "#f0f5f8",
        steel:  "#5a7a8a",
        deep:   "#0d1e2a",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
