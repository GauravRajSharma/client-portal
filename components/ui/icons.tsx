// Icons: drop-in replacement for @tamagui/lucide-icons.
//
// Both packages wrap the same Lucide glyph set with identical component names, so
// screens only change the import specifier. The difference: lucide-react-native
// icons take a real `color` (hex/rgb string) — they do NOT resolve Tamagui `$tokens`.
// Use the `C` map below for the theme colors icons used to reference as `$primary` etc.
//
// (Light-only palette, mirrored from global.css. Dark-mode icon tinting is a
//  follow-up — wire useColorScheme + swap C when a dark pass lands.)
export * from "lucide-react-native";

export const C = {
  fg: "#0e2440",
  text2: "#46566a",
  text3: "#7c8b9e",
  primary: "#0b4ea0",
  primaryStrong: "#083a78",
  onPrimary: "#ffffff",
  brand: "#1b6fc2",
  good: "#1f9d6b",
  warn: "#c8860d",
  bad: "#d6453d",
  border: "rgba(15,40,80,0.12)",
  surface: "#ffffff",
} as const;
