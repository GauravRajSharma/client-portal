import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui } from "tamagui";

import { createThemes, defaultComponentThemes } from "@tamagui/theme-builder";
import * as Colors from "@tamagui/colors";

// Clinical Slate — cool slate-tinted neutrals (hue ~222). Never pure #000/#fff;
// every neutral carries a faint slate chroma. Lightness ramp preserved from the
// generated base so component contrast assumptions still hold.
const darkPalette = [
  "hsla(222, 22%, 5%, 1)",
  "hsla(222, 20%, 8%, 1)",
  "hsla(222, 18%, 13%, 1)",
  "hsla(222, 17%, 18%, 1)",
  "hsla(222, 16%, 23%, 1)",
  "hsla(222, 15%, 29%, 1)",
  "hsla(222, 14%, 35%, 1)",
  "hsla(222, 13%, 41%, 1)",
  "hsla(222, 12%, 47%, 1)",
  "hsla(222, 12%, 54%, 1)",
  "hsla(222, 18%, 90%, 1)",
  "hsla(222, 24%, 97%, 1)",
];
const lightPalette = [
  "hsla(222, 24%, 99%, 1)",
  "hsla(222, 20%, 96%, 1)",
  "hsla(222, 17%, 92%, 1)",
  "hsla(222, 15%, 87%, 1)",
  "hsla(222, 14%, 81%, 1)",
  "hsla(222, 13%, 73%, 1)",
  "hsla(222, 12%, 64%, 1)",
  "hsla(222, 12%, 55%, 1)",
  "hsla(222, 13%, 45%, 1)",
  "hsla(222, 16%, 36%, 1)",
  "hsla(222, 28%, 18%, 1)",
  "hsla(222, 32%, 11%, 1)",
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
      },
      dark: {
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  // Deep clinical indigo (~#3B4B9A). Single accent: primary actions, current
  // selection, focus rings, state indicators. Not decoration.
  accent: {
    palette: {
      dark: [
        "hsla(230, 44%, 30%, 1)",
        "hsla(230, 45%, 34%, 1)",
        "hsla(230, 46%, 38%, 1)",
        "hsla(230, 47%, 42%, 1)",
        "hsla(230, 48%, 46%, 1)",
        "hsla(230, 49%, 50%, 1)",
        "hsla(230, 52%, 55%, 1)",
        "hsla(230, 55%, 60%, 1)",
        "hsla(230, 58%, 66%, 1)",
        "hsla(230, 62%, 72%, 1)",
        "hsla(230, 70%, 91%, 1)",
        "hsla(230, 75%, 96%, 1)",
      ],
      light: [
        "hsla(230, 48%, 36%, 1)",
        "hsla(230, 48%, 39%, 1)",
        "hsla(230, 47%, 42%, 1)",
        "hsla(230, 47%, 45%, 1)",
        "hsla(230, 46%, 48%, 1)",
        "hsla(230, 46%, 52%, 1)",
        "hsla(230, 48%, 57%, 1)",
        "hsla(230, 52%, 63%, 1)",
        "hsla(230, 58%, 71%, 1)",
        "hsla(230, 66%, 82%, 1)",
        "hsla(230, 60%, 95%, 1)",
        "hsla(230, 60%, 97%, 1)",
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

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes,
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;
export type Themes = typeof builtThemes;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
