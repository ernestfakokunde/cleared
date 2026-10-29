import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)", paper: "var(--paper)", surface: "var(--surface)",
        line: "var(--line)", muted: "var(--muted)", accent: "var(--accent)",
        "accent-bright": "var(--accent-bright)", warn: "var(--warn)", danger: "var(--danger)",
      },
      fontFamily: { sans: ["var(--font-geist)", "sans-serif"], serif: ["var(--font-instrument)", "serif"], mono: ["var(--font-geist-mono)", "monospace"] },
      borderRadius: { card: "12px" },
      maxWidth: { content: "1120px" },
    },
  },
  plugins: [],
};

export default config;
