import type { Config } from "tailwindcss";

// Design tokens follow the Brand Explorations mockups in design/mockups/
// (see DECISIONS.md). Brand-specific values also live in src/config/brand.ts.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#3A2028",
        primary: { DEFAULT: "#B03A48", dark: "#8E2E3A" },
        accent: "#D98E4F",
        porcelain: "#FAF0ED",
        card: "#FFFFFF",
        hairline: "#F0DBD4",
      },
      borderRadius: {
        DEFAULT: "16px",
        card: "16px",
      },
      fontFamily: {
        sans: ["Vazirmatn", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      lineHeight: {
        fa: "1.75",
      },
    },
  },
  plugins: [],
};
export default config;
