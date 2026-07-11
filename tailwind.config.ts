import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutrals are CSS vars (RGB channels) so they flip in dark mode and
        // still support /opacity modifiers. Accents stay fixed.
        background: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)", // text primary
          secondary: "rgb(var(--ink-2) / <alpha-value>)", // text secondary
        },
        correct: "#00C853", // clean green
        wrong: "#FF3B30",
        cta: "rgb(var(--cta) / <alpha-value>)",
        lives: "#FF3B30",
      },
      fontFamily: {
        // Handwritten scorecard: Kalam is the site's handwriting (all body
        // text); the "condensed" slot - titles, scores, wordmarks, crossword
        // letters - is the fat marker pen. Inter remains the loading fallback.
        sans: ["var(--font-hand)", "var(--font-inter)", "system-ui", "sans-serif"],
        condensed: ["var(--font-marker)", "var(--font-hand)", "cursive"],
        display: ["var(--font-oswald)", "var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        // Display values — the hero of every card
        display: ["3.5rem", { lineHeight: "1", fontWeight: "900" }],
        "display-sm": ["2.5rem", { lineHeight: "1", fontWeight: "800" }],
      },
      maxWidth: {
        game: "540px",
        board: "720px",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-8px)" },
          "40%": { transform: "translateX(8px)" },
          "60%": { transform: "translateX(-6px)" },
          "80%": { transform: "translateX(6px)" },
        },
        "pop-fade": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0.25" },
        },
        "fade-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        "pop-fade": "pop-fade 0.2s ease-out forwards",
        "fade-up": "fade-up 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
