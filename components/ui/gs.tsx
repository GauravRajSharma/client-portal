// gluestack-pattern primitives, NativeWind-backed.
//
// gluestack-ui v5's Box/HStack/VStack/Text ARE thin NativeWind wrappers over RN
// core components. The interactive `gluestack-ui add` CLI needs a TTY (won't run
// in CI/headless), so these are hand-authored to the same API + engine (NativeWind
// v4 / Tailwind v3). Screens import from here.
//
// NativeWind (jsxImportSource) makes `className` work on all RN core components,
// so HStack/VStack are just Views with a flex direction.
import type { ReactNode } from "react";
import {
  View,
  Text as RNText,
  Pressable as RNPressable,
  TextInput,
  ActivityIndicator,
  ScrollView as RNScrollView,
  useWindowDimensions,
  type ViewProps,
  type TextProps,
  type PressableProps,
} from "react-native";

const cx = (...parts: (string | undefined | false | null)[]) => parts.filter(Boolean).join(" ");

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

/** Paragraph — body copy: muted, comfortable line-height. Overridable via className. */
export function Paragraph({ className, ...p }: TextProps & { className?: string }) {
  return <RNText className={cx("font-plex text-text2 leading-[20px]", className)} {...p} />;
}

/** Heading — bold title text. Screens set size via className (default 20px). */
export function Heading({ className, ...p }: TextProps & { className?: string }) {
  return <RNText className={cx("font-plex-bold text-fg text-[20px]", className)} {...p} />;
}

export const Pressable = RNPressable;
export const Input = TextInput;
export const ScrollView = RNScrollView;

// Tamagui's <Spinner> → RN ActivityIndicator. `color` accepts a hex/string.
export function Spinner({ size = "small", color }: { size?: "small" | "large"; color?: string }) {
  return <ActivityIndicator size={size} color={color} />;
}

// Soft card shadow (was Tamagui shadowColor/shadowRadius/shadowOffset). NativeWind's
// shadow utilities don't express custom RN shadows reliably on native, so pass this
// as a `style` prop on cards. ponytail: one shared value, not per-card tuning.
export const shadowSoft = {
  shadowColor: "rgba(16,36,61,0.07)",
  shadowOpacity: 1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

/**
 * Button — filled primary by default. `variant`: solid | outline | chromeless.
 * Replaces Tamagui's <Button> (incl. size/icon/chromeless). String children are
 * wrapped in Text; node children pass through.
 */
export function Button({
  children,
  onPress,
  variant = "solid",
  icon: Icon,
  disabled,
  className,
  textClassName,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: "solid" | "outline" | "chromeless";
  icon?: (p: { size?: number; color?: string }) => ReactNode;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}) {
  const shell =
    variant === "solid"
      ? "bg-primary active:bg-primaryStrong"
      : variant === "outline"
        ? "border border-border bg-surface active:opacity-80"
        : "active:opacity-60";
  const txt = variant === "solid" ? "text-onPrimary" : "text-primary";
  const iconHex = variant === "solid" ? "#ffffff" : "#0b4ea0";
  return (
    <RNPressable
      onPress={disabled ? undefined : onPress}
      className={cx(
        "flex-row items-center justify-center gap-2 h-[44px] px-4 rounded-[12px]",
        shell,
        disabled && "opacity-60",
        className,
      )}
    >
      {Icon ? <Icon size={18} color={iconHex} /> : null}
      {typeof children === "string" ? (
        <Text className={cx("text-[15px] font-plex-bold", txt, textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </RNPressable>
  );
}

/**
 * useMedia — minimal replacement for Tamagui's useMedia(). Only `.md` (>=768,
 * the web/tablet breakpoint) is used across the app; sm/lg included for parity.
 */
export function useMedia() {
  const { width } = useWindowDimensions();
  return { sm: width >= 640, md: width >= 768, lg: width >= 1024 };
}
