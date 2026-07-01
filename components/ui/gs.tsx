// gluestack-pattern primitives, NativeWind-backed.
//
// gluestack-ui v5's Box/HStack/VStack/Text ARE thin NativeWind wrappers over RN
// core components. The interactive `gluestack-ui add` CLI needs a TTY (won't run
// in CI/headless), so these are hand-authored to the same API + engine (NativeWind
// v4 / Tailwind v3). Screens import from here; swapping in CLI-generated versions
// later is a drop-in with no screen changes.
//
// NativeWind (jsxImportSource) makes `className` work on all RN core components,
// so HStack/VStack are just Views with a flex direction.
import {
  View,
  Text as RNText,
  Pressable as RNPressable,
  TextInput,
  ActivityIndicator,
  ScrollView as RNScrollView,
  type ViewProps,
  type TextProps,
} from "react-native";

const cx = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(" ");

export function Box({ className, ...p }: ViewProps & { className?: string }) {
  return <View className={className} {...p} />;
}

export function HStack({ className, ...p }: ViewProps & { className?: string }) {
  return <View className={cx("flex-row", className)} {...p} />;
}

export function VStack({ className, ...p }: ViewProps & { className?: string }) {
  return <View className={cx("flex-col", className)} {...p} />;
}

export function Text({ className, ...p }: TextProps & { className?: string }) {
  // Default to the Plex sans face + primary text color; screens override per use.
  return <RNText className={cx("font-plex text-fg", className)} {...p} />;
}

export const Pressable = RNPressable;
export const Input = TextInput;
export const ScrollView = RNScrollView;

// Tamagui's <Spinner> → RN ActivityIndicator. `color` accepts a hex/string.
export function Spinner({ size = "small", color }: { size?: "small" | "large"; color?: string }) {
  return <ActivityIndicator size={size} color={color} />;
}
