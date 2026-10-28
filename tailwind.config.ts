import type { Config } from "tailwindcss";

// Colours are CSS variables (src/app/globals.css) so the night theme swaps
// them in one place.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="night"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        card: v("card"),
        ink: v("ink"),
        soft: v("soft"),
        line: v("line"),
        pink: { DEFAULT: v("pink"), deep: v("pink-deep"), pale: v("pink-pale") },
        lilac: { DEFAULT: v("lilac"), pale: v("lilac-pale") },
        mint: { DEFAULT: v("mint"), pale: v("mint-pale") },
        sky: { DEFAULT: v("sky"), pale: v("sky-pale") },
        lemon: { DEFAULT: v("lemon"), pale: v("lemon-pale") },
        buy: v("buy"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "system-ui", "Segoe UI", "Arial", "sans-serif"],
        display: ['"Inter Variable"', "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
      borderRadius: { blob: "12px" },
      boxShadow: {
        sticker: "0 1px 2px rgb(0 0 0 / 0.04)",
        pop: "0 1px 3px rgb(0 0 0 / 0.10)",
        popsm: "none",
      },
    },
  },
  plugins: [],
} satisfies Config;
