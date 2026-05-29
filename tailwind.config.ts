import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: {
          DEFAULT: "#F4F2EE",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "var(--foreground)",
        },
      },
      boxShadow: {
        'premium': '0 2px 4px rgba(0,0,0,0.02), 0 10px 20px rgba(0,0,0,0.03)',
        'premium-hover': '0 4px 8px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
