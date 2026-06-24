/**
 * Deltalab UI kit. Components built to match the Deltalab Mobile prototype exactly
 * (see DESIGN_DELTALAB.md). New screens use these; older Clinical-Slate primitives in
 * primitives.tsx remain until each screen is migrated.
 */
import type { ReactNode } from "react";
import type { NamedExoticComponent } from "react";
import { ArrowLeft, ChevronRight } from "@tamagui/lucide-icons";
import { ScrollView, Text, XStack, YStack, styled } from "tamagui";
import type { LabResult, LabStatus } from "@/server/dto";

/** Map a lab status to Deltalab color tokens + plain-language label. */
export function dlStatus(s: LabStatus): { label: string; color: string; soft: string } {
  switch (s) {
    case "normal":
      return { label: "Normal", color: "$good", soft: "$goodSoft" };
    case "low":
      return { label: "Low", color: "$warn", soft: "$warnSoft" };
    case "high":
      return { label: "High", color: "$warn", soft: "$warnSoft" };
    case "critical-low":
      return { label: "Very low", color: "$bad", soft: "$badSoft" };
    case "critical-high":
      return { label: "Very high", color: "$bad", soft: "$badSoft" };
    default:
      return { label: "—", color: "$text3", soft: "$surface3" };
  }
}

/** Page frame: soft-blue app background, scrolls, constrains width on web. */
export function DLScreen({ children, maxWidth = 920 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <ScrollView flex={1} bg="$appBg" showsVerticalScrollIndicator={false}>
      <YStack width="100%" maxW={maxWidth} mx="auto" px="$4" pt="$3" pb="$10" gap="$3.5">
        {children}
      </YStack>
    </ScrollView>
  );
}

/** White surface card with the Deltalab border + soft shadow. Never nest. */
export const DLCard = styled(YStack, {
  name: "DLCard",
  bg: "$surface",
  borderWidth: 1,
  borderColor: "$border",
  rounded: 17,
  shadowColor: "rgba(16,36,61,0.07)",
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
});

/** Status chip: soft bg, colored dot + UPPERCASE label. */
export function DLStatusPill({
  label,
  color,
  soft,
  size = "md",
}: {
  label: string;
  color: any;
  soft: any;
  size?: "sm" | "md";
}) {
  return (
    <XStack
      items="center"
      gap="$1.5"
      bg={soft}
      px={size === "sm" ? "$2" : "$2.5"}
      py="$1"
      rounded={20}
      self="flex-start"
    >
      <YStack width={size === "sm" ? 5 : 6} height={size === "sm" ? 5 : 6} rounded={10} bg={color} />
      <Text
        fontSize={size === "sm" ? 10 : 11}
        fontWeight="700"
        color={color}
        textTransform="uppercase"
        letterSpacing={0.3}
      >
        {label}
      </Text>
    </XStack>
  );
}

/** 2x2 metric tile: soft icon chip + status dot, label, big mono value. */
export function MetricTile({
  Icon,
  label,
  value,
  unit,
  color,
  soft,
  onPress,
}: {
  Icon: NamedExoticComponent<any>;
  label: string;
  value: string;
  unit?: string;
  color: any;
  soft: any;
  onPress?: () => void;
}) {
  return (
    <YStack
      flex={1}
      bg="$surface"
      borderWidth={1}
      borderColor="$border"
      rounded={16}
      p="$3.5"
      gap="$2"
      shadowColor="rgba(16,36,61,0.08)"
      shadowRadius={6}
      shadowOffset={{ width: 0, height: 2 }}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.7, y: 1 } : undefined}
    >
      <XStack items="center" justify="space-between">
        <YStack width={34} height={34} rounded={10} bg={soft} items="center" justify="center">
          <Icon size={18} color={color} />
        </YStack>
        <YStack width={8} height={8} rounded={10} bg={color} />
      </XStack>
      <Text fontSize={12.5} fontWeight="600" color="$text2" numberOfLines={1} mt="$1">
        {label}
      </Text>
      <Text fontSize={22} fontWeight="700" color="$color12" fontFamily="$mono" letterSpacing={-0.5}>
        {value}
        {unit ? (
          <Text fontSize={11} color="$text3" fontWeight="500" fontFamily="$body">
            {" "}
            {unit}
          </Text>
        ) : null}
      </Text>
    </YStack>
  );
}

/** Red-soft attention banner (home). */
export function AlertBanner({
  Icon,
  title,
  detail,
  onPress,
  Chevron,
}: {
  Icon: NamedExoticComponent<any>;
  title: string;
  detail?: string;
  onPress?: () => void;
  Chevron?: NamedExoticComponent<any>;
}) {
  return (
    <XStack
      items="center"
      gap="$3"
      bg="$badSoft"
      borderWidth={1}
      borderColor="$bad"
      rounded={15}
      px="$3.5"
      py="$3"
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.8 } : undefined}
    >
      <YStack width={36} height={36} rounded={10} bg="$bad" items="center" justify="center">
        <Icon size={18} color="#fff" />
      </YStack>
      <YStack flex={1}>
        <Text fontSize={13.5} fontWeight="600" color="$color12">
          {title}
        </Text>
        {detail ? (
          <Text fontSize={12} color="$text2" mt="$0.5">
            {detail}
          </Text>
        ) : null}
      </YStack>
      {Chevron ? <Chevron size={18} color="$bad" /> : null}
    </XStack>
  );
}

/** Patient mini card: gradient-ish avatar (primary) + name + sub. */
export function PatientMini({
  initials,
  name,
  sub,
}: {
  initials: string;
  name?: string;
  sub?: string;
}) {
  return (
    <DLCard>
      <XStack items="center" gap="$3" p="$3.5">
        <YStack width={50} height={50} rounded={14} bg="$primary" items="center" justify="center">
          <Text fontSize={18} fontWeight="700" color="$onPrimary">
            {initials}
          </Text>
        </YStack>
        <YStack flex={1}>
          <Text fontSize={15.5} fontWeight="700" color="$color12" numberOfLines={1}>
            {name ?? "—"}
          </Text>
          {sub ? (
            <Text fontSize={12} color="$text2" mt="$0.5" numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </DLCard>
  );
}

/** Row of compact summary stat chips. */
export function SummaryChips({ items }: { items: { value: string; label: string; color?: any }[] }) {
  return (
    <XStack gap="$2">
      {items.map((s, i) => (
        <YStack
          key={i}
          flex={1}
          bg="$surface"
          borderWidth={1}
          borderColor="$border"
          rounded={13}
          py="$2.5"
          items="center"
          shadowColor="rgba(16,36,61,0.06)"
          shadowRadius={5}
          shadowOffset={{ width: 0, height: 1 }}
        >
          <Text fontSize={20} fontWeight="700" fontFamily="$mono" color={s.color ?? "$color12"}>
            {s.value}
          </Text>
          <Text fontSize={10} fontWeight="600" color="$text2" mt="$0.5">
            {s.label}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}

/** Recent-result row: colored dot + name/sub + value/status. */
export function RecentRow({
  result,
  onPress,
  border = true,
}: {
  result: LabResult;
  onPress?: () => void;
  border?: boolean;
}) {
  const m = dlStatus(result.status);
  return (
    <XStack
      items="center"
      gap="$3"
      px="$3.5"
      py="$3"
      borderTopWidth={border ? 1 : 0}
      borderColor="$border"
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.6 } : undefined}
    >
      <YStack width={9} height={9} rounded={10} bg={m.color as any} />
      <YStack flex={1} minW={0}>
        <Text fontSize={14} fontWeight="600" color="$color12" numberOfLines={1}>
          {result.name}
        </Text>
        {result.takenAt ? (
          <Text fontSize={11.5} color="$text2" mt="$0.5">
            {result.takenAt.slice(0, 10)}
          </Text>
        ) : null}
      </YStack>
      <YStack items="flex-end">
        <Text fontSize={14.5} fontWeight="600" fontFamily="$mono" color={m.color as any}>
          {result.value}
        </Text>
        <Text fontSize={10} fontWeight="700" color={m.color as any} textTransform="uppercase" letterSpacing={0.3}>
          {m.label}
        </Text>
      </YStack>
    </XStack>
  );
}

/** Reference range bar: track + green normal zone + colored value marker. */
export function RangeBar({
  value,
  low,
  high,
  color,
}: {
  value?: number;
  low?: number;
  high?: number;
  color: any;
}) {
  if (value == null || low == null || high == null || high <= low) return null;
  const span = high - low;
  const min = low - span * 0.25;
  const max = high + span * 0.25;
  const clamp = (n: number) => Math.max(0, Math.min(1, (n - min) / (max - min)));
  const marker = clamp(value) * 100;
  const zL = clamp(low) * 100;
  const zW = (clamp(high) - clamp(low)) * 100;
  return (
    <YStack height={7} rounded={6} bg="$surface3" position="relative" overflow="hidden">
      <YStack
        position="absolute"
        t={0}
        b={0}
        l={`${zL}%`}
        width={`${zW}%`}
        bg="$goodSoft"
        borderLeftWidth={2}
        borderRightWidth={2}
        borderColor="$good"
        opacity={0.85}
      />
      <YStack
        position="absolute"
        t="50%"
        l={`${marker}%`}
        width={13}
        height={13}
        rounded={10}
        bg={color}
        borderWidth={2.5}
        borderColor="$surface"
        y={-6.5}
        x={-6.5}
      />
    </YStack>
  );
}

/**
 * Results list card: colored left edge (status), name + value/pill, range bar + ref.
 * The colored left edge is intentional in the Deltalab prototype (DESIGN_DELTALAB.md).
 */
export function ResultRow({
  result,
  onPress,
}: {
  result: LabResult;
  onPress?: () => void;
}) {
  const m = dlStatus(result.status);
  const refText =
    result.referenceLow != null && result.referenceHigh != null
      ? `${result.referenceLow}–${result.referenceHigh}${result.unit ? ` ${result.unit}` : ""}`
      : undefined;
  return (
    <YStack
      bg="$surface"
      borderWidth={1}
      borderColor="$border"
      borderLeftWidth={4}
      borderLeftColor={m.color as any}
      rounded={15}
      px="$3.5"
      py="$3"
      gap="$2.5"
      shadowColor="rgba(16,36,61,0.06)"
      shadowRadius={5}
      shadowOffset={{ width: 0, height: 1 }}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.7 } : undefined}
    >
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack flex={1} minW={0}>
          <Text fontSize={15} fontWeight="600" color="$color12" numberOfLines={2}>
            {result.name}
          </Text>
          {result.panel ? (
            <Text fontSize={11.5} color="$text2" mt="$0.5">
              {result.panel}
            </Text>
          ) : null}
        </YStack>
        <YStack items="flex-end" gap="$1.5">
          <XStack items="baseline" gap="$1">
            <Text fontSize={19} fontWeight="700" fontFamily="$mono" color={m.color as any}>
              {result.value}
            </Text>
            {result.unit ? (
              <Text fontSize={10.5} color="$text3">
                {result.unit}
              </Text>
            ) : null}
          </XStack>
          <DLStatusPill label={m.label} color={m.color} soft={m.soft} size="sm" />
        </YStack>
      </XStack>
      {refText ? (
        <YStack gap="$1.5">
          <RangeBar
            value={result.numericValue}
            low={result.referenceLow}
            high={result.referenceHigh}
            color={m.color}
          />
          <XStack justify="space-between">
            <Text fontSize={11} color="$text2">
              Normal {refText}
            </Text>
            {result.takenAt ? (
              <Text fontSize={11} color="$text2">
                {result.takenAt.slice(0, 10)}
              </Text>
            ) : null}
          </XStack>
        </YStack>
      ) : null}
    </YStack>
  );
}

/** Horizontal scroll filter chips. */
export function DeptChips({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack gap="$2" px="$0.5">
        {items.map((t) => {
          const active = t.key === value;
          return (
            <XStack
              key={t.key}
              height={36}
              px="$3.5"
              items="center"
              rounded={18}
              borderWidth={1}
              borderColor={active ? "$primary" : "$border"}
              bg={active ? "$primary" : "$surface"}
              onPress={() => onChange(t.key)}
              pressStyle={{ opacity: 0.8 }}
            >
              <Text fontSize={13} fontWeight="600" color={active ? "$onPrimary" : "$text2"}>
                {t.label}
              </Text>
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}

/** Quiet back affordance used on every detail screen. */
export function DLBack({ label = "Back", onPress }: { label?: string; onPress: () => void }) {
  return (
    <XStack items="center" gap="$2" self="flex-start" py="$1.5" pr="$3" onPress={onPress} pressStyle={{ opacity: 0.6 }}>
      <ArrowLeft size={18} color="$text2" />
      <Text fontSize={14} fontWeight="500" color="$text2">
        {label}
      </Text>
    </XStack>
  );
}

/** Page title block: title + optional subtitle, with an optional right-aligned action. */
export function DLTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <XStack items="flex-start" justify="space-between" gap="$3" px="$0.5">
      <YStack flex={1} gap="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize={13} color="$text2">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {action}
    </XStack>
  );
}

/**
 * Tappable navigation row: soft icon chip, title (+ optional detail), chevron.
 * Used for record shortcuts (Home grid, Profile "More", visit sub-screens).
 */
export function DLNavRow({
  Icon,
  title,
  detail,
  onPress,
  border = false,
  tint = "$primary",
  tintSoft = "$primarySoft",
}: {
  Icon: NamedExoticComponent<any>;
  title: string;
  detail?: string;
  onPress: () => void;
  border?: boolean;
  tint?: any;
  tintSoft?: any;
}) {
  return (
    <XStack
      items="center"
      gap="$3"
      px="$3.5"
      py="$3.5"
      borderTopWidth={border ? 1 : 0}
      borderColor="$border"
      onPress={onPress}
      pressStyle={{ opacity: 0.6 }}
    >
      <YStack width={38} height={38} rounded={10} bg={tintSoft} items="center" justify="center">
        <Icon size={18} color={tint} />
      </YStack>
      <YStack flex={1} minW={0}>
        <Text fontSize={14.5} fontWeight="600" color="$color12" numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text fontSize={12} color="$text2" mt="$0.5" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </YStack>
      <ChevronRight size={18} color="$text3" />
    </XStack>
  );
}

/** Format a money amount the Nepali way (grouped), prefixed with its currency. */
export function dlMoney(amount: number | undefined, currency = "NPR"): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** AlphaGate: a centered lock card for features not yet available in alpha. */
export function AlphaGate({
  Icon,
  title,
  detail,
}: {
  Icon: NamedExoticComponent<any>;
  title: string;
  detail?: string;
}) {
  return (
    <YStack items="center" justify="center" gap="$3" py="$9" px="$5">
      <YStack width={62} height={62} rounded={18} bg="$primarySoft" items="center" justify="center">
        <Icon size={28} color="$primary" />
      </YStack>
      <XStack items="center" gap="$1.5" bg="$primarySoft" px="$2.5" py="$1" rounded={20}>
        <Text fontSize={10.5} fontWeight="700" color="$primary" letterSpacing={0.4}>
          NOT AVAILABLE IN ALPHA
        </Text>
      </XStack>
      <YStack items="center" gap="$1.5" maxW={320}>
        <Text fontSize={18} fontWeight="700" color="$color12" text="center">
          {title}
        </Text>
        {detail ? (
          <Text fontSize={13.5} color="$text2" text="center" lineHeight={20}>
            {detail}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}
