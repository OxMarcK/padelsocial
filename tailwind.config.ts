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
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
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
