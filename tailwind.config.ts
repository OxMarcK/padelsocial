import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "court-night": "#0E1420",
        "court-root": "#07090D",
        "flood-white": "#F5F7FA",
        "glass-blue": "#1E64F0",
        "lime-serve": "#C8F542",
        "clay-orange": "#F0642D",
        "net-grey": "#6B7484",
        surface: "#131C2B",
        "surface-alt": "#0B111C",
        ink: "#C9D2DF",
        "ink-muted": "#9AA5B5",
        // --- Light "mint" palette — the design system from CLAUDE.md (Agenda,
        // tournament companion, sessions, admin). mint-ink is the one ink
        // color (#0E2318); the dark-theme tokens above are legacy.
        "mint-bg-1": "#CFE4D7",
        "mint-bg-2": "#F5F8F5",
        "mint-bg-3": "#DDEBE0",
        "mint-surface": "rgba(255,255,255,0.82)",
        "mint-ink": "#0E2318",
        "mint-ink-muted": "#5C7266",
        "mint-net": "#8A9C92",
        "mint-lime": "#D2E95C",
        "mint-lime-ink": "#4F6E14",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mint: ["var(--font-jakarta)", "sans-serif"],
      },
      // Same shadow scale as the Agenda (app/page.tsx): soft, deep, ink-tinted.
      boxShadow: {
        card: "0 10px 24px rgba(14,35,24,.07)",
        pill: "0 4px 12px rgba(14,35,24,.06)",
      },
      keyframes: {
        psPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".25" },
        },
      },
      animation: {
        pulse2: "psPulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
