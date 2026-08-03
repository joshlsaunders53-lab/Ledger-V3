import type { Config } from "tailwindcss";

// These map 1:1 onto the CSS custom properties already used by the
// original Ledger app (see app/globals.css :root). Nothing here is a
// new palette — it's the existing design system exposed to Tailwind.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./layouts/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        panel: "var(--panel)",
        "panel-raised": "var(--panel-raised)",
        "panel-hover": "var(--panel-hover)",
        hairline: "var(--hairline)",
        "hairline-soft": "var(--hairline-soft)",
        brass: {
          DEFAULT: "var(--brass)",
          soft: "var(--brass-soft)",
          dim: "var(--brass-dim)",
        },
        clay: {
          DEFAULT: "var(--clay)",
          dim: "var(--clay-dim)",
        },
        teal: {
          DEFAULT: "var(--teal)",
          dim: "var(--teal-dim)",
        },
        ledger: {
          text: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        // shadcn/ui expects these semantic tokens to exist.
        // Mapped onto the same palette so shadcn primitives stay on-brand.
        border: "var(--hairline)",
        input: "var(--hairline)",
        ring: "var(--brass)",
        background: "var(--ink)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--brass)",
          foreground: "#241C0C",
        },
        secondary: {
          DEFAULT: "var(--panel-raised)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--clay)",
          foreground: "#2E120C",
        },
        muted: {
          DEFAULT: "var(--panel-raised)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--panel-hover)",
          foreground: "var(--text)",
        },
        card: {
          DEFAULT: "var(--panel)",
          foreground: "var(--text)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        lg: "14px",
        md: "10px",
        sm: "7px",
      },
      keyframes: {
        riseIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        riseIn: "riseIn .45s cubic-bezier(.22,.61,.36,1) both",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
