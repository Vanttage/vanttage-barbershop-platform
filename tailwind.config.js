/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C47A",
          dim: "#8B6B2E",
          subtle: "rgba(201,168,76,0.08)",
          border: "rgba(201,168,76,0.20)",
        },
        surface: "#111113",
        elevated: "#18181C",
        overlay: "#1F1F24",
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.04)",
        DEFAULT: "rgba(255,255,255,0.08)",
        strong: "rgba(255,255,255,0.14)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        md: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        gold: "0 0 20px rgba(201,168,76,0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
