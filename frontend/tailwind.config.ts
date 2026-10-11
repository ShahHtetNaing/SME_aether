import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e1233",
        paper: "#ffffff",
        panel: "#ffffff",
        edge: "#e9e2f8",
        muted: "#4c3d66",
        accent: "#6d28d9",
        navy: "#3b0764",
      },
    },
  },
  plugins: [],
};

export default config;
