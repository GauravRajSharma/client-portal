/**
 * Deltalab UI kit. Components built to match the Deltalab Mobile prototype exactly
 * (see DESIGN_DELTALAB.md). NativeWind-backed (gluestack primitives).
 */
import type { ReactNode } from "react";
import type { ComponentType } from "react";
import { ArrowLeft, ChevronRight, C } from "./icons";
import { HStack, VStack, Text, Pressable, ScrollView, shadowSoft } from "./gs";
import type { LabResult, LabStatus } from "@/server/dto";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

type StatusStyle = { label: string; text: string; softBg: string; hex: string };

/** Map a lab status to Deltalab colors (className fragments + a hex for dots/bars). */
export function dlStatus(s: LabStatus): StatusStyle {
  switch (s) {
    case "normal":
      return { label: "Normal", text: "text-good", softBg: "bg-goodSoft", hex: C.good };
    case "low":
      return { label: "Low", text: "text-warn", softBg: "bg-warnSoft", hex: C.warn };
    case "high":
      return { label: "High", text: "text-warn", softBg: "bg-warnSoft", hex: C.warn };
    case "critical-low":
      return { label: "Very low", text: "text-bad", softBg: "bg-badSoft", hex: C.bad };
    case "critical-high":
      return { label: "Very high", text: "text-bad", softBg: "bg-badSoft", hex: C.bad };
    default:
      return { label: "—", text: "text-text3", softBg: "bg-surface3", hex: C.text3 };
  }
}

/** Page frame: soft-blue app background, scrolls, constrains width on web. */
export function DLScreen({ children, maxWidth = 920 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <ScrollView className="flex-1 bg-appBg" showsVerticalScrollIndicator={false}>
      <VStack className="w-full mx-auto px-[17px] pt-[12px] pb-[57px] gap-[15px]" style={{ maxWidth }}>
        {children}
      </VStack>
    </ScrollView>
  );
}

/** White surface card with the Deltalab border + soft shadow. Never nest. */
export function DLCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <VStack className={cx("bg-surface border border-border rounded-[17px]", className)} style={shadowSoft}>
      {children}
    </VStack>
  );
}

/** Status chip: soft bg, colored dot + UPPERCASE label. */
export function DLStatusPill({
  label,
  text,
  softBg,
  hex,
  size = "md",
}: {
  label: string;
  text: string;
  softBg: string;
  hex: string;
  size?: "sm" | "md";
}) {
  return (
    <HStack className={cx("items-center gap-[4px] py-[2px] rounded-[20px] self-start", softBg, size === "sm" ? "px-[7px]" : "px-[10px]")}>
      <VStack className={cx("rounded-full", size === "sm" ? "w-[5px] h-[5px]" : "w-[6px] h-[6px]")} style={{ backgroundColor: hex }} />
      <Text className={cx("font-plex-bold uppercase tracking-[0.3px]", text, size === "sm" ? "text-[10px]" : "text-[11px]")}>
        {label}
      </Text>
    </HStack>
  );
}

/** 2x2 metric tile: soft icon chip + status dot, label, big mono value. */
export function MetricTile({
  Icon,
  label,
  value,
  unit,
  text,
  softBg,
  hex,
  onPress,
}: {
  Icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  unit?: string;
  text: string;
  softBg: string;
  hex: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-1 bg-surface border border-border rounded-[16px] p-[15px] gap-[7px]", onPress && "active:opacity-70")}
      style={shadowSoft}
    >
      <HStack className="items-center justify-between">
        <VStack className={cx("w-[34px] h-[34px] rounded-[10px] items-center justify-center", softBg)}>
          <Icon size={18} color={hex} />
        </VStack>
        <VStack className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: hex }} />
      </HStack>
      <Text className="text-[12.5px] font-plex-semibold text-text2 mt-[2px]" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-[22px] font-plex-bold font-plex-mono text-fg tracking-[-0.5px]">
        {value}
        {unit ? <Text className="text-[11px] text-text3 font-plex-medium"> {unit}</Text> : null}
      </Text>
    </Pressable>
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
  Icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  detail?: string;
  onPress?: () => void;
  Chevron?: ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-row items-center gap-[12px] bg-badSoft border border-bad rounded-[15px] px-[15px] py-[12px]", onPress && "active:opacity-80")}
    >
      <VStack className="w-[36px] h-[36px] rounded-[10px] bg-bad items-center justify-center">
        <Icon size={18} color="#fff" />
      </VStack>
      <VStack className="flex-1">
        <Text className="text-[13.5px] font-plex-semibold text-fg">{title}</Text>
        {detail ? <Text className="text-[12px] text-text2 mt-[1px]">{detail}</Text> : null}
      </VStack>
      {Chevron ? <Chevron size={18} color={C.bad} /> : null}
    </Pressable>
  );
}

/** Patient mini card: primary avatar + name + sub. */
export function PatientMini({ initials, name, sub }: { initials: string; name?: string; sub?: string }) {
  return (
    <DLCard>
      <HStack className="items-center gap-[12px] p-[15px]">
        <VStack className="w-[50px] h-[50px] rounded-[14px] bg-primary items-center justify-center">
          <Text className="text-[18px] font-plex-bold text-onPrimary">{initials}</Text>
        </VStack>
        <VStack className="flex-1">
          <Text className="text-[15.5px] font-plex-bold text-fg" numberOfLines={1}>
            {name ?? "—"}
          </Text>
          {sub ? (
            <Text className="text-[12px] text-text2 mt-[1px]" numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </DLCard>
  );
}

/** Row of compact summary stat chips. */
export function SummaryChips({ items }: { items: { value: string; label: string; className?: string }[] }) {
  return (
    <HStack className="gap-[7px]">
      {items.map((s, i) => (
        <VStack key={i} className="flex-1 bg-surface border border-border rounded-[13px] py-[10px] items-center" style={shadowSoft}>
          <Text className={cx("text-[20px] font-plex-bold font-plex-mono", s.className ?? "text-fg")}>{s.value}</Text>
          <Text className="text-[10px] font-plex-semibold text-text2 mt-[1px]">{s.label}</Text>
        </VStack>
      ))}
    </HStack>
  );
}

/** Recent-result row: colored dot + name/sub + value/status. */
export function RecentRow({ result, onPress, border = true }: { result: LabResult; onPress?: () => void; border?: boolean }) {
  const m = dlStatus(result.status);
  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-row items-center gap-[12px] px-[15px] py-[12px]", border && "border-t border-border", onPress && "active:opacity-60")}
    >
      <VStack className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: m.hex }} />
      <VStack className="flex-1 min-w-0">
        <Text className="text-[14px] font-plex-semibold text-fg" numberOfLines={1}>
          {result.name}
        </Text>
        {result.takenAt ? <Text className="text-[11.5px] text-text2 mt-[1px]">{result.takenAt.slice(0, 10)}</Text> : null}
      </VStack>
      <VStack className="items-end">
        <Text className={cx("text-[14.5px] font-plex-semibold font-plex-mono", m.text)}>{result.value}</Text>
        <Text className={cx("text-[10px] font-plex-bold uppercase tracking-[0.3px]", m.text)}>{m.label}</Text>
      </VStack>
    </Pressable>
  );
}

/** Reference range bar: track + green normal zone + colored value marker. */
export function RangeBar({ value, low, high, color }: { value?: number; low?: number; high?: number; color: string }) {
  if (value == null || low == null || high == null || high <= low) return null;
  const span = high - low;
  const min = low - span * 0.25;
  const max = high + span * 0.25;
  const clamp = (n: number) => Math.max(0, Math.min(1, (n - min) / (max - min)));
  const marker = clamp(value) * 100;
  const zL = clamp(low) * 100;
  const zW = (clamp(high) - clamp(low)) * 100;
  return (
    <VStack className="h-[7px] rounded-[6px] bg-surface3 relative overflow-hidden">
      <VStack
        className="absolute top-0 bottom-0 bg-goodSoft border-l-2 border-r-2 border-good opacity-[0.85]"
        style={{ left: `${zL}%`, width: `${zW}%` }}
      />
      <VStack
        className="absolute top-[50%] w-[13px] h-[13px] rounded-full border-[2.5px] border-surface"
        style={{ left: `${marker}%`, backgroundColor: color, transform: [{ translateX: -6.5 }, { translateY: -6.5 }] }}
      />
    </VStack>
  );
}

/**
 * Results list card: colored left edge (status), name + value/pill, range bar + ref.
 * The colored left edge is intentional in the Deltalab prototype (DESIGN_DELTALAB.md).
 */
export function ResultRow({ result, onPress }: { result: LabResult; onPress?: () => void }) {
  const m = dlStatus(result.status);
  const refText =
    result.referenceLow != null && result.referenceHigh != null
      ? `${result.referenceLow}–${result.referenceHigh}${result.unit ? ` ${result.unit}` : ""}`
      : undefined;
  return (
    <Pressable
      onPress={onPress}
      className={cx("bg-surface border border-border border-l-4 rounded-[15px] px-[15px] py-[12px] gap-[10px]", onPress && "active:opacity-70")}
      style={{ ...shadowSoft, borderLeftColor: m.hex }}
    >
      <HStack className="items-start justify-between gap-[12px]">
        <VStack className="flex-1 min-w-0">
          <Text className="text-[15px] font-plex-semibold text-fg" numberOfLines={2}>
            {result.name}
          </Text>
          {result.panel ? <Text className="text-[11.5px] text-text2 mt-[1px]">{result.panel}</Text> : null}
        </VStack>
        <VStack className="items-end gap-[4px]">
          <HStack className="items-baseline gap-[2px]">
            <Text className={cx("text-[19px] font-plex-bold font-plex-mono", m.text)}>{result.value}</Text>
            {result.unit ? <Text className="text-[10.5px] text-text3">{result.unit}</Text> : null}
          </HStack>
          <DLStatusPill label={m.label} text={m.text} softBg={m.softBg} hex={m.hex} size="sm" />
        </VStack>
      </HStack>
      {refText ? (
        <VStack className="gap-[4px]">
          <RangeBar value={result.numericValue} low={result.referenceLow} high={result.referenceHigh} color={m.hex} />
          <HStack className="justify-between">
            <Text className="text-[11px] text-text2">Normal {refText}</Text>
            {result.takenAt ? <Text className="text-[11px] text-text2">{result.takenAt.slice(0, 10)}</Text> : null}
          </HStack>
        </VStack>
      ) : null}
    </Pressable>
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
      <HStack className="gap-[7px] px-[1px]">
        {items.map((t) => {
          const active = t.key === value;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              className={cx(
                "h-[36px] px-[15px] flex-row items-center rounded-[18px] border active:opacity-80",
                active ? "border-primary bg-primary" : "border-border bg-surface",
              )}
            >
              <Text className={cx("text-[13px] font-plex-semibold", active ? "text-onPrimary" : "text-text2")}>{t.label}</Text>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}

/** Quiet back affordance used on every detail screen. */
export function DLBack({ label = "Back", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-[7px] self-start py-[4px] pr-[12px] active:opacity-60">
      <ArrowLeft size={18} color={C.text2} />
      <Text className="text-[14px] font-plex-medium text-text2">{label}</Text>
    </Pressable>
  );
}

/** Page title block: title + optional subtitle, with an optional right-aligned action. */
export function DLTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <HStack className="items-start justify-between gap-[12px] px-[1px]">
      <VStack className="flex-1 gap-[2px]">
        <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px]">{title}</Text>
        {subtitle ? <Text className="text-[13px] text-text2">{subtitle}</Text> : null}
      </VStack>
      {action}
    </HStack>
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
  tintHex = C.primary,
  tintSoftBg = "bg-primarySoft",
}: {
  Icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  detail?: string;
  onPress: () => void;
  border?: boolean;
  tintHex?: string;
  tintSoftBg?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-row items-center gap-[12px] px-[15px] py-[15px] active:opacity-60", border && "border-t border-border")}
    >
      <VStack className={cx("w-[38px] h-[38px] rounded-[10px] items-center justify-center", tintSoftBg)}>
        <Icon size={18} color={tintHex} />
      </VStack>
      <VStack className="flex-1 min-w-0">
        <Text className="text-[14.5px] font-plex-semibold text-fg" numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text className="text-[12px] text-text2 mt-[1px]" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </VStack>
      <ChevronRight size={18} color={C.text3} />
    </Pressable>
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
  Icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  detail?: string;
}) {
  return (
    <VStack className="items-center justify-center gap-[12px] py-[50px] px-[23px]">
      <VStack className="w-[62px] h-[62px] rounded-[18px] bg-primarySoft items-center justify-center">
        <Icon size={28} color={C.primary} />
      </VStack>
      <HStack className="items-center gap-[4px] bg-primarySoft px-[10px] py-[2px] rounded-[20px]">
        <Text className="text-[10.5px] font-plex-bold text-primary tracking-[0.4px]">NOT AVAILABLE IN ALPHA</Text>
      </HStack>
      <VStack className="items-center gap-[4px] max-w-[320px]">
        <Text className="text-[18px] font-plex-bold text-fg text-center">{title}</Text>
        {detail ? <Text className="text-[13.5px] text-text2 text-center leading-[20px]">{detail}</Text> : null}
      </VStack>
    </VStack>
  );
}
