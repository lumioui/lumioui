/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // `<alpha-value>` keeps opacity modifiers (bg-primary/15, border-primary/30)
      // working with HSL CSS vars on both web + native.
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          text: "hsl(var(--primary-text) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        // Categorical series palette (bg-chart-1..5) — mirrors colors.chart1..5.
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
          3: "hsl(var(--chart-3) / <alpha-value>)",
          4: "hsl(var(--chart-4) / <alpha-value>)",
          5: "hsl(var(--chart-5) / <alpha-value>)",
        },
        // Category tints (bg-tint-orange…) — scheme-aware content colours for
        // icon tiles, avatars, tags. Mirrors colors.tintRed…tintSlate.
        tint: {
          red: "hsl(var(--tint-red) / <alpha-value>)",
          orange: "hsl(var(--tint-orange) / <alpha-value>)",
          amber: "hsl(var(--tint-amber) / <alpha-value>)",
          lime: "hsl(var(--tint-lime) / <alpha-value>)",
          green: "hsl(var(--tint-green) / <alpha-value>)",
          teal: "hsl(var(--tint-teal) / <alpha-value>)",
          sky: "hsl(var(--tint-sky) / <alpha-value>)",
          blue: "hsl(var(--tint-blue) / <alpha-value>)",
          indigo: "hsl(var(--tint-indigo) / <alpha-value>)",
          violet: "hsl(var(--tint-violet) / <alpha-value>)",
          pink: "hsl(var(--tint-pink) / <alpha-value>)",
          slate: "hsl(var(--tint-slate) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        // Alpha is baked into --overlay (e.g. "240 10% 4% / 0.5") — do NOT
        // add <alpha-value> here or hsl() ends up with two slashes (invalid).
        overlay: "hsl(var(--overlay))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Soft, single-source shadows — cards/sheets/dialogs share these.
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        sheet: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
