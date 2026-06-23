import type { ReactNode } from "react";
import {
  Button,
  H3,
  Paragraph,
  ScrollView,
  Text,
  Theme,
  XStack,
  YStack,
  styled,
} from "tamagui";
import type { NamedExoticComponent } from "react";

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
    <YStack
      width="100%"
      maxW={maxWidth}
      mx="auto"
      px="$4"
      pt="$4"
      pb="$10"
      gap="$4"
      $md={{ px: "$6", pt: "$6" }}
    >
      {children}
    </YStack>
  );
  if (!scroll) return <YStack flex={1} bg="$background">{inner}</YStack>;
  return (
    <ScrollView flex={1} bg="$background" showsVerticalScrollIndicator={false}>
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
    <YStack gap="$2.5">
      {(title || action) && (
        <XStack items="center" justify="space-between" minH="$2">
          {title ? (
            <Text fontSize="$5" fontWeight="700" color="$color11">
              {title}
            </Text>
          ) : (
            <YStack />
          )}
          {action}
        </XStack>
      )}
      {children}
    </YStack>
  );
}

/** Panel — a single bordered surface. Never nest Panels (see DESIGN.md). */
export const Panel = styled(YStack, {
  name: "Panel",
  bg: "$color1",
  borderColor: "$borderColor",
  borderWidth: 1,
  rounded: "$6",
  p: "$4",
  gap: "$3",
});

/** Row — a tappable list row inside a Panel/list. */
export const Row = styled(XStack, {
  name: "Row",
  items: "center",
  justify: "space-between",
  gap: "$3",
  py: "$3",
  px: "$1",
  pressStyle: { opacity: 0.6 },
  hoverStyle: { bg: "$color2" },
  animation: "quick",
});

type ThemeName = "success" | "warning" | "error" | "accent" | "neutral";

/** StatusPill — compact status chip. Wraps a sub-theme so colors stay consistent. */
export function StatusPill({
  label,
  theme = "neutral",
  Icon,
  size = "md",
}: {
  label: string;
  theme?: ThemeName;
  Icon?: NamedExoticComponent<any>;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "$1.5" : "$2.5";
  const font = size === "sm" ? "$1" : "$2";
  const body = (
    <XStack
      items="center"
      gap="$1.5"
      px={pad}
      py="$1"
      rounded="$10"
      bg={theme === "neutral" ? "$color3" : "$color4"}
    >
      {Icon ? <Icon size={size === "sm" ? 12 : 14} color="$color11" /> : null}
      <Text fontSize={font} fontWeight="700" color="$color11">
        {label}
      </Text>
    </XStack>
  );
  if (theme === "neutral") return body;
  return <Theme name={theme}>{body}</Theme>;
}

/** Money — formats minor/major NPR amounts consistently, tabular. */
export function Money({
  amount,
  currency = "NPR",
  color = "$color",
  size = "$6",
  weight = "700",
}: {
  amount?: number;
  currency?: string;
  color?: any;
  size?: any;
  weight?: any;
}) {
  const v =
    amount === undefined || Number.isNaN(amount)
      ? "—"
      : `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return (
    <Text fontSize={size} fontWeight={weight} color={color} fontVariant={["tabular-nums"]}>
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
  Icon?: NamedExoticComponent<any>;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <YStack items="center" justify="center" gap="$3" py="$9" px="$4">
      {Icon ? (
        <YStack p="$3" rounded="$10" bg="$color3">
          <Icon size={26} color="$color10" />
        </YStack>
      ) : null}
      <YStack items="center" gap="$1.5" maxW={420}>
        <Text fontSize="$6" fontWeight="700" color="$color12" text="center">
          {title}
        </Text>
        {detail ? (
          <Paragraph fontSize="$3" color="$color10" text="center">
            {detail}
          </Paragraph>
        ) : null}
      </YStack>
      {action}
    </YStack>
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
    <Theme name="error">
      <YStack items="center" justify="center" gap="$3" py="$9" px="$4">
        <YStack items="center" gap="$1.5" maxW={420}>
          <Text fontSize="$6" fontWeight="700" color="$color12" text="center">
            {title}
          </Text>
          <Paragraph fontSize="$3" color="$color11" text="center">
            {detail}
          </Paragraph>
        </YStack>
        {onRetry ? (
          <Theme name="accent">
            <Button size="$3" onPress={onRetry}>
              Try again
            </Button>
          </Theme>
        ) : null}
      </YStack>
    </Theme>
  );
}

/** Skeleton — shimmering placeholder block for loading states (no spinners in content). */
export const Skeleton = styled(YStack, {
  name: "Skeleton",
  bg: "$color3",
  rounded: "$4",
  height: 16,
  opacity: 0.7,
  animation: "lazy",
  enterStyle: { opacity: 0.4 },
});

/** SkeletonPanel — a Panel-shaped loading placeholder, repeated `count` times. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <YStack gap="$3">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} gap="$2.5">
          <Skeleton width="55%" />
          <Skeleton width="80%" height={12} />
          <Skeleton width="35%" height={12} />
        </Panel>
      ))}
    </YStack>
  );
}
