import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Card states (from Figma PHASE 1)
        salmon: "#F5C9B5",      // draft state card bg
        "salmon-text": "#7a4a38",
        yellow: "#F4D981",      // scheduled state card bg
        "yellow-text": "#6b5a1e",
        blue: "#BBD4F2",        // completed state card bg
        "blue-text": "#2a4a63",
        // Action accent dots
        "accent-blue": "#3B82F6",
        "accent-orange": "#F97316",
        // Neutrals
        ink: "#1a1a1a",         // primary text
        "ink-soft": "#555555",  // secondary text
        "ink-faint": "#999999", // tertiary text
        page: "#FFFFFF",        // page background
        "page-alt": "#F5F5F5",  // alt background (matches Figma F5F5F5)
        hairline: "#EAEAEA",    // borders
        "bubble-user": "#ECECEC", // user chat bubble
      },
      fontFamily: {
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
