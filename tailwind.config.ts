import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // WhoHadMore design system — NYT Games x Robinhood
        background: "#FFFFFF",
        surface: "#F8F8F8",
        border: "#E8E8E8",
        ink: {
          DEFAULT: "#111111", // text primary
          secondary: "#888888", // text secondary
        },
        correct: "#00C853", // clean green
        wrong: "#FF3B30",
        cta: "#1A1A1A",
        lives: "#FF3B30",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
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
