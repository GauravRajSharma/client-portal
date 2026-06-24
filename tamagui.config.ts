import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui } from "tamagui";

import { createThemes, defaultComponentThemes } from "@tamagui/theme-builder";
import * as Colors from "@tamagui/colors";

// Deltalab — blue-tinted neutrals (hue ~214) on a clinical-blue system. Exact
// surfaces/text live in the named tokens below ($surface, $text2…); this ramp keeps
// $background/$color/$borderColor on-brand for stock + transitional components.
const darkPalette = [
  "hsla(214, 38%, 8%, 1)",
  "hsla(213, 34%, 12%, 1)",
  "hsla(213, 30%, 16%, 1)",
  "hsla(213, 26%, 21%, 1)",
  "hsla(213, 22%, 26%, 1)",
  "hsla(213, 18%, 32%, 1)",
  "hsla(213, 16%, 40%, 1)",
  "hsla(212, 16%, 50%, 1)",
  "hsla(211, 18%, 62%, 1)",
  "hsla(210, 22%, 74%, 1)",
  "hsla(208, 40%, 91%, 1)",
  "hsla(208, 50%, 97%, 1)",
];
const lightPalette = [
  "hsla(214, 45%, 98%, 1)",
  "hsla(214, 40%, 95%, 1)",
  "hsla(214, 34%, 91%, 1)",
  "hsla(214, 28%, 86%, 1)",
  "hsla(214, 24%, 79%, 1)",
  "hsla(214, 20%, 70%, 1)",
  "hsla(214, 16%, 59%, 1)",
  "hsla(214, 16%, 49%, 1)",
  "hsla(214, 20%, 39%, 1)",
  "hsla(214, 28%, 28%, 1)",
  "hsla(214, 45%, 16%, 1)",
  "hsla(214, 55%, 10%, 1)",
];

const lightShadows = {
  shadow1: "rgba(0,0,0,0.04)",
  shadow2: "rgba(0,0,0,0.08)",
  shadow3: "rgba(0,0,0,0.16)",
  shadow4: "rgba(0,0,0,0.24)",
  shadow5: "rgba(0,0,0,0.32)",
  shadow6: "rgba(0,0,0,0.4)",
};

const darkShadows = {
  shadow1: "rgba(0,0,0,0.2)",
  shadow2: "rgba(0,0,0,0.3)",
  shadow3: "rgba(0,0,0,0.4)",
  shadow4: "rgba(0,0,0,0.5)",
  shadow5: "rgba(0,0,0,0.6)",
  shadow6: "rgba(0,0,0,0.7)",
};

// we're adding some example sub-themes for you to show how they are done, "success" "warning", "error":

const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...Colors.green,
        ...Colors.red,
        ...Colors.yellow,
        ...lightShadows,
        shadowColor: lightShadows.shadow1,
        // --- Deltalab named tokens (exact). New UI uses these: $primary, $surface, etc.
        appBg: "#eef2fc",
        surface: "#ffffff",
        surface2: "#f2f6fc",
        surface3: "#e9eff7",
        border: "rgba(15,40,80,0.12)",
        borderStrong: "rgba(15,40,80,0.2)",
        text2: "#46566a",
        text3: "#7c8b9e",
        primary: "#0b4ea0",
        primaryStrong: "#083a78",
        primarySoft: "#e5edf9",
        onPrimary: "#ffffff",
        brand: "#1b6fc2",
        brandSoft: "#e7f0fb",
        good: "#1f9d6b",
        goodSoft: "#e2f4ec",
        warn: "#c8860d",
        warnSoft: "#fbf0d8",
        bad: "#d6453d",
        badSoft: "#fbe5e4",
        chartGrid: "#e6edf4",
        ring: "rgba(11,78,160,0.28)",
      },
      dark: {
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        shadowColor: darkShadows.shadow1,
        appBg: "#0a1626",
        surface: "#11233a",
        surface2: "#16283e",
        surface3: "#1d3047",
        border: "rgba(255,255,255,0.12)",
        borderStrong: "rgba(255,255,255,0.2)",
        text2: "#9cafc3",
        text3: "#6a7f96",
        primary: "#5a9af0",
        primaryStrong: "#7fb2f5",
        primarySoft: "#0f2c52",
        onPrimary: "#04203f",
        brand: "#6aa8f7",
        brandSoft: "#0e2c46",
        good: "#34c98a",
        goodSoft: "#0f3328",
        warn: "#e0a836",
        warnSoft: "#3a2e10",
        bad: "#f0625a",
        badSoft: "#3a1b1a",
        chartGrid: "#1c3349",
        ring: "rgba(90,154,240,0.32)",
      },
    },
  },

  // Deltalab clinical blue (~#0b4ea0). Primary actions, current selection, focus.
  accent: {
    palette: {
      dark: [
        "hsla(212, 70%, 30%, 1)",
        "hsla(212, 72%, 34%, 1)",
        "hsla(212, 74%, 38%, 1)",
        "hsla(212, 76%, 42%, 1)",
        "hsla(211, 78%, 47%, 1)",
        "hsla(210, 80%, 52%, 1)",
        "hsla(209, 82%, 58%, 1)",
        "hsla(208, 85%, 64%, 1)",
        "hsla(208, 88%, 71%, 1)",
        "hsla(207, 90%, 80%, 1)",
        "hsla(208, 80%, 91%, 1)",
        "hsla(208, 80%, 96%, 1)",
      ],
      light: [
        "hsla(212, 86%, 28%, 1)",
        "hsla(212, 86%, 31%, 1)",
        "hsla(212, 85%, 34%, 1)",
        "hsla(212, 83%, 38%, 1)",
        "hsla(211, 80%, 42%, 1)",
        "hsla(210, 78%, 47%, 1)",
        "hsla(209, 78%, 53%, 1)",
        "hsla(208, 82%, 61%, 1)",
        "hsla(208, 86%, 70%, 1)",
        "hsla(207, 90%, 82%, 1)",
        "hsla(208, 70%, 95%, 1)",
        "hsla(208, 70%, 97%, 1)",
      ],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },
  },
});

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === "client" &&
  process.env.NODE_ENV === "production"
    ? ({} as any)
    : (builtThemes as any);

// const _config = createTamagui({
//   ...defaultConfig,
//   tokens: {
//     colors: {
//       // Light theme colors
//       backgroundLight: "#ffffff",
//       textLight: "#333333",
//       primaryLight: "#00796b", // Calm teal
//       secondaryLight: "#0288d1", // Professional blue
//       accentLight: "#7e57c2", // Soft purple for accents
//       successLight: "#4caf50",
//       warningLight: "#ff9800",
//       errorLight: "#f44336",

//       // Dark theme colors
//       backgroundDark: "#121212",
//       textDark: "#f0f0f0",
//       primaryDark: "#009688",
//       secondaryDark: "#03a9f4",
//       accentDark: "#9575cd",
//       successDark: "#81c784",
//       warningDark: "#ffb74d",
//       errorDark: "#e57373",
//     },
//     // Optional typography tokens
//     fontSizes: {
//       small: 14,
//       body: 16,
//       large: 20,
//       heading: 24,
//     },
//     // Optional spacing tokens
//     space: {
//       none: 0,
//       xs: 4,
//       sm: 8,
//       md: 16,
//       lg: 24,
//       xl: 32,
//     },
//     // Optional border radii
//     radii: {
//       none: 0,
//       sm: 4,
//       md: 8,
//       lg: 16,
//       full: 9999,
//     },
//   },
//   themes: {
//     light: {
//       background: "$colors.backgroundLight",
//       color: "$colors.textLight",
//       primary: "$colors.primaryLight",
//       secondary: "$colors.secondaryLight",
//       accent: "$colors.accentLight",
//       success: "$colors.successLight",
//       warning: "$colors.warningLight",
//       error: "$colors.errorLight",
//     },
//     dark: {
//       background: "$colors.backgroundDark",
//       color: "$colors.textDark",
//       primary: "$colors.primaryDark",
//       secondary: "$colors.secondaryDark",
//       accent: "$colors.accentDark",
//       success: "$colors.successDark",
//       warning: "$colors.warningDark",
//       error: "$colors.errorDark",
//     },
//   },
//   // Common shorthands for easy styling
//   shorthands: {
//     p: "padding",
//     pt: "paddingTop",
//     pr: "paddingRight",
//     pb: "paddingBottom",
//     pl: "paddingLeft",
//     m: "margin",
//     mt: "marginTop",
//     mr: "marginRight",
//     mb: "marginBottom",
//     ml: "marginLeft",
//   },
//   defaults: {
//     theme: "light", // use light theme by default
//   },
//   themeClassNameOnRoot: true,
// });

// IBM Plex (loaded in app/_layout via @expo-google-fonts). Inherit the default
// size/lineHeight/weight scales, override family + per-weight faces.
const sansFont = {
  ...defaultConfig.fonts.body,
  family: "IBMPlexSans_400Regular",
  face: {
    400: { normal: "IBMPlexSans_400Regular" },
    500: { normal: "IBMPlexSans_500Medium" },
    600: { normal: "IBMPlexSans_600SemiBold" },
    700: { normal: "IBMPlexSans_700Bold" },
  },
} as any;
const monoFont = {
  ...defaultConfig.fonts.body,
  family: "IBMPlexMono_400Regular",
  face: {
    400: { normal: "IBMPlexMono_400Regular" },
    500: { normal: "IBMPlexMono_500Medium" },
    600: { normal: "IBMPlexMono_600SemiBold" },
    700: { normal: "IBMPlexMono_600SemiBold" },
  },
} as any;

// Global density: the UI read slightly too spacious, so tighten every space token
// (gap / padding / margin) to 0.95x. Type, sizes, and radii are untouched.
const SPACE_SCALE = 0.95;
const scaledSpace = Object.fromEntries(
  Object.entries(defaultConfig.tokens.space).map(([k, v]) =>
    typeof v === "number" ? [k, Math.round(v * SPACE_SCALE * 100) / 100] : [k, v],
  ),
) as typeof defaultConfig.tokens.space;

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    space: scaledSpace,
  },
  fonts: {
    ...defaultConfig.fonts,
    heading: sansFont,
    body: sansFont,
    mono: monoFont,
  },
  themes,
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;
export type Themes = typeof builtThemes;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
