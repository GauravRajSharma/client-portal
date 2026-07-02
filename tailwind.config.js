/** @type {import('tailwindcss').Config} */
// ponytail: semantic colors reference CSS vars from global.css, so light/dark
// theming lives in one place. No <alpha-value> channels — tokens carry their own
// alpha (borders are rgba). Add channel-split vars later only if opacity modifiers
// on these colors are actually needed.
module.exports = {
  // Light is the primary theme (DESIGN.md: dark renders poorly on target devices).
  // Dark is gated behind a `.dark` class that nothing adds yet — so it never
  // auto-activates from the OS. Wire a real toggle in a dedicated dark-mode pass.
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        appBg: "var(--color-app-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        surface3: "var(--color-surface3)",
        border: "var(--color-border)",
        borderStrong: "var(--color-border-strong)",
        fg: "var(--color-fg)",
        text2: "var(--color-text2)",
        text3: "var(--color-text3)",
        primary: "var(--color-primary)",
        primaryStrong: "var(--color-primary-strong)",
        primarySoft: "var(--color-primary-soft)",
        onPrimary: "var(--color-on-primary)",
        brand: "var(--color-brand)",
        brandSoft: "var(--color-brand-soft)",
        good: "var(--color-good)",
        goodSoft: "var(--color-good-soft)",
        warn: "var(--color-warn)",
        warnSoft: "var(--color-warn-soft)",
        bad: "var(--color-bad)",
        badSoft: "var(--color-bad-soft)",
        chartGrid: "var(--color-chart-grid)",
      },
      // RN doesn't map font-weight → named faces, so weight is expressed via
      // fontFamily. Prefixed `plex-*` to avoid colliding with Tailwind's built-in
      // font-medium/semibold/bold weight utilities.
      fontFamily: {
        plex: ["IBMPlexSans_400Regular"],
        "plex-medium": ["IBMPlexSans_500Medium"],
        "plex-semibold": ["IBMPlexSans_600SemiBold"],
        "plex-bold": ["IBMPlexSans_700Bold"],
        "plex-mono": ["IBMPlexMono_400Regular"],
      },
    },
  },
  plugins: [],
};
