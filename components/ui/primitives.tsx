import type { ReactNode } from "react";
import type { ComponentType } from "react";
import { Box, HStack, VStack, Text, Pressable, ScrollView, Button, Paragraph, shadowSoft } from "./gs";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

/**
 * Screen — the page frame. Constrains content width on web, scrolls, and gives a
 * consistent reading column. Use as the outermost element of every patient screen.
 */
export function Screen({
  children,
  scroll = true,
  maxWidth = 920,
}: {
  children: ReactNode;
  scroll?: boolean;
  maxWidth?: number;
}) {
  const inner = (
    <VStack
      className="w-full mx-auto px-[17px] pt-[17px] pb-[57px] gap-[17px] md:px-[30px] md:pt-[30px]"
      style={{ maxWidth }}
    >
      {children}
    </VStack>
  );
  if (!scroll) return <VStack className="flex-1 bg-appBg">{inner}</VStack>;
  return (
    <ScrollView className="flex-1 bg-appBg" showsVerticalScrollIndicator={false}>
      {inner}
    </ScrollView>
  );
}

/** Section — a labelled block. Optional action on the right of the heading. */
export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <VStack className="gap-[10px]">
      {(title || action) && (
        <HStack className="items-center justify-between min-h-[28px]">
          {title ? <Text className="text-[17px] font-plex-bold text-fg">{title}</Text> : <VStack />}
          {action}
        </HStack>
      )}
      {children}
    </VStack>
  );
}

/** Panel — a single bordered surface. Never nest Panels (see DESIGN.md). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <VStack
      className={cx("bg-surface border border-border rounded-[16px] p-[17px] gap-[12px]", className)}
      style={shadowSoft}
    >
      {children}
    </VStack>
  );
}

/** Row — a tappable list row inside a Panel/list. */
export function Row({
  children,
  onPress,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cx(
        "flex-row items-center justify-between gap-[12px] py-[12px] px-[2px] active:opacity-60",
        className,
      )}
    >
      {children}
    </Pressable>
  );
}

type ThemeName = "success" | "warning" | "error" | "accent" | "neutral";

// Sub-theme → (soft bg, strong text/icon) token pair. Replaces Tamagui <Theme name>.
const PILL: Record<ThemeName, { bg: string; fg: string; hex: string }> = {
  neutral: { bg: "bg-surface3", fg: "text-text2", hex: "#46566a" },
  success: { bg: "bg-goodSoft", fg: "text-good", hex: "#1f9d6b" },
  warning: { bg: "bg-warnSoft", fg: "text-warn", hex: "#c8860d" },
  error: { bg: "bg-badSoft", fg: "text-bad", hex: "#d6453d" },
  accent: { bg: "bg-primarySoft", fg: "text-primary", hex: "#0b4ea0" },
};

/** StatusPill — compact status chip. Colors stay consistent per theme. */
export function StatusPill({
  label,
  theme = "neutral",
  Icon,
  size = "md",
}: {
  label: string;
  theme?: ThemeName;
  Icon?: ComponentType<{ size?: number; color?: string }>;
  size?: "sm" | "md";
}) {
  const t = PILL[theme];
  return (
    <HStack
      className={cx(
        "items-center gap-[4px] py-[2px] rounded-full self-start",
        size === "sm" ? "px-[4px]" : "px-[10px]",
        t.bg,
      )}
    >
      {Icon ? <Icon size={size === "sm" ? 12 : 14} color={t.hex} /> : null}
      <Text className={cx(size === "sm" ? "text-[11px]" : "text-[13px]", "font-plex-bold", t.fg)}>{label}</Text>
    </HStack>
  );
}

/** Money — formats minor/major NPR amounts consistently, tabular. */
export function Money({
  amount,
  currency = "NPR",
  className,
}: {
  amount?: number;
  currency?: string;
  className?: string;
}) {
  const v =
    amount === undefined || Number.isNaN(amount)
      ? "-"
      : `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return (
    <Text
      className={cx("text-[20px] font-plex-bold text-fg", className)}
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {v}
    </Text>
  );
}

/** EmptyState — teaches the surface, never just "nothing here". */
export function EmptyState({
  Icon,
  title,
  detail,
  action,
}: {
  Icon?: ComponentType<{ size?: number; color?: string }>;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <VStack className="items-center justify-center gap-[12px] py-[50px] px-[17px]">
      {Icon ? (
        <VStack className="p-[12px] rounded-full bg-surface3">
          <Icon size={26} color="#7c8b9e" />
        </VStack>
      ) : null}
      <VStack className="items-center gap-[4px] max-w-[420px]">
        <Text className="text-[19px] font-plex-bold text-fg text-center">{title}</Text>
        {detail ? <Paragraph className="text-[15px] text-text3 text-center">{detail}</Paragraph> : null}
      </VStack>
      {action}
    </VStack>
  );
}

/** ErrorState — recoverable failure with a retry affordance. */
export function ErrorState({
  title = "Something went wrong",
  detail = "We couldn't load this right now. Please try again.",
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <VStack className="items-center justify-center gap-[12px] py-[50px] px-[17px]">
      <VStack className="items-center gap-[4px] max-w-[420px]">
        <Text className="text-[19px] font-plex-bold text-bad text-center">{title}</Text>
        <Paragraph className="text-[15px] text-text2 text-center">{detail}</Paragraph>
      </VStack>
      {onRetry ? (
        <Button onPress={onRetry} className="h-[40px]">
          Try again
        </Button>
      ) : null}
    </VStack>
  );
}

/** Skeleton — placeholder block for loading states (no spinners in content). */
export function Skeleton({ className }: { className?: string }) {
  return <Box className={cx("bg-surface3 rounded-[9px] h-[16px] opacity-70", className)} />;
}

/** SkeletonList — Panel-shaped loading placeholders, repeated `count` times. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <VStack className="gap-[12px]">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} className="gap-[10px]">
          <Skeleton className="w-[55%]" />
          <Skeleton className="w-[80%] h-[12px]" />
          <Skeleton className="w-[35%] h-[12px]" />
        </Panel>
      ))}
    </VStack>
  );
}
