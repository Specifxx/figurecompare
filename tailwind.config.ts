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
        sans: ['"M PLUS Rounded 1c"', "ui-rounded", "system-ui", "Segoe UI", "Arial", "sans-serif"],
        display: ["Fredoka", '"M PLUS Rounded 1c"', "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: { blob: "28px" },
      boxShadow: {
        sticker: "0 2px 0 rgb(var(--ink) / 0.08), 0 10px 24px -10px rgb(var(--pink) / 0.45)",
        pop: "4px 4px 0 rgb(var(--ink) / 0.9)",
        popsm: "2px 2px 0 rgb(var(--ink) / 0.9)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-10px) rotate(8deg)" } },
        wiggle: { "0%,100%": { transform: "rotate(-2deg)" }, "50%": { transform: "rotate(2deg)" } },
        bounceIn: { "0%": { transform: "scale(.8)", opacity: "0" }, "60%": { transform: "scale(1.05)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        twinkle: { "0%,100%": { opacity: ".25", transform: "scale(.8)" }, "50%": { opacity: "1", transform: "scale(1.15)" } },
        blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(.1)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        wiggle: "wiggle .35s ease-in-out",
        bounceIn: "bounceIn .5s ease-out both",
        marquee: "marquee 40s linear infinite",
        twinkle: "twinkle 2.4s ease-in-out infinite",
        blink: "blink 5s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
