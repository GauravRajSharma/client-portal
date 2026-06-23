/**
 * Deltalab UI kit. Components built to match the Deltalab Mobile prototype exactly
 * (see DESIGN_DELTALAB.md). New screens use these; older Clinical-Slate primitives in
 * primitives.tsx remain until each screen is migrated.
 */
import type { ReactNode } from "react";
import type { NamedExoticComponent } from "react";
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
