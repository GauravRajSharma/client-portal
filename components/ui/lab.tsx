import { HStack, VStack, Text, Pressable } from "./gs";
import type { LabResult, LabTrendPoint } from "@/server/dto";
import { labStatusMeta } from "./status";
import { StatusPill } from "./primitives";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

type ThemeName = "success" | "warning" | "error" | "accent" | "neutral";
const THEME_HEX: Record<ThemeName, string> = {
  success: "#1f9d6b",
  warning: "#c8860d",
  error: "#d6453d",
  accent: "#0b4ea0",
  neutral: "#0e2440",
};

/**
 * RangeBar — shows where a value sits within its reference range. A calm band with a
 * marker; the marker turns to the status theme when out of range. No axis clutter.
 */
function RangeBar({
  value,
  low,
  high,
  theme,
  attention,
}: {
  value?: number;
  low?: number;
  high?: number;
  theme: ThemeName;
  attention: boolean;
}) {
  if (value === undefined || low === undefined || high === undefined || high <= low) {
    return null;
  }
  // Pad the visible track 25% beyond the reference range on each side.
  const span = high - low;
  const min = low - span * 0.25;
  const max = high + span * 0.25;
  const clamp = (n: number) => Math.max(0, Math.min(1, (n - min) / (max - min)));
  const markerPct = clamp(value) * 100;
  const bandLeft = clamp(low) * 100;
  const bandWidth = (clamp(high) - clamp(low)) * 100;
  const markerHex = attention && theme !== "neutral" ? THEME_HEX[theme] : "#0e2440";

  return (
    <VStack className="h-[10px] bg-surface3 rounded-full overflow-hidden relative">
      {/* the "normal" band, so a patient can see where in-range sits */}
      <VStack
        className="absolute top-[3px] h-[4px] rounded-full bg-borderStrong"
        style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
      />
      <VStack
        className="absolute h-full rounded-full"
        style={{ left: `${markerPct}%`, width: attention ? 4 : 3, backgroundColor: markerHex }}
      />
    </VStack>
  );
}

/**
 * LabValueRow — the core lab primitive. Status and plain-language label first, the
 * number second, then reference range and a range bar. Tappable (e.g. to a trend).
 */
export function LabValueRow({
  result,
  onPress,
}: {
  result: LabResult;
  onPress?: () => void;
}) {
  const meta = labStatusMeta(result.status);
  const refText =
    result.referenceLow !== undefined && result.referenceHigh !== undefined
      ? `${result.referenceLow}–${result.referenceHigh}${result.unit ? ` ${result.unit}` : ""}`
      : undefined;

  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-col items-stretch gap-[10px] py-[12px] px-[2px] min-h-[64px]", onPress && "active:opacity-60")}
    >
      <HStack className="items-start justify-between gap-[12px]">
        <VStack className="flex-1 gap-[7px]">
          {/* Status first: plain-language verdict leads, before the number. */}
          <StatusPill label={meta.label} theme={meta.theme} Icon={meta.Icon} size="sm" />
          <Text className="text-[16px] font-plex-semibold text-fg" numberOfLines={2}>
            {result.name}
          </Text>
          {refText ? <Text className="text-[13px] text-text3">Normal {refText}</Text> : null}
        </VStack>
        <HStack className="items-baseline gap-[2px]">
          <Text className="text-[26px] font-plex-bold text-fg" style={{ fontVariant: ["tabular-nums"] }}>
            {result.value}
          </Text>
          {result.unit ? <Text className="text-[13px] text-text3">{result.unit}</Text> : null}
        </HStack>
      </HStack>
      <RangeBar
        value={result.numericValue}
        low={result.referenceLow}
        high={result.referenceHigh}
        theme={meta.theme}
        attention={meta.attention}
      />
    </Pressable>
  );
}

/**
 * Sparkline — dependency-free mini trend (vertical bars). Values normalized to the
 * series min/max; out-of-reference points are emphasized. Upgrade to an SVG line
 * (react-native-svg) only if a richer chart is needed.
 * ponytail: bars, not SVG — good enough for an at-a-glance trend.
 */
export function Sparkline({
  points,
  height = 40,
  low,
  high,
}: {
  points: LabTrendPoint[];
  height?: number;
  low?: number;
  high?: number;
}) {
  if (!points.length) return null;
  const values = points.map((p) => p.value);
  // Include the reference range in the vertical scale so the "normal" band is
  // always visible, even when every reading sits inside it.
  const lo = Math.min(...values, ...(low !== undefined ? [low] : []));
  const hi = Math.max(...values, ...(high !== undefined ? [high] : []));
  const min = lo;
  const max = hi;
  const range = max - min || 1;
  const inRange = (v: number) =>
    (low === undefined || v >= low) && (high === undefined || v <= high);
  const yPct = (v: number) => ((v - min) / range) * 100;

  const showBand = low !== undefined && high !== undefined;
  const bandBottom = showBand ? yPct(low as number) : 0;
  const bandHeight = showBand ? yPct(high as number) - bandBottom : 0;

  return (
    <VStack className="relative" style={{ height }}>
      {showBand ? (
        <VStack
          className="absolute left-0 right-0 bg-surface3 rounded-[5px]"
          style={{ bottom: `${bandBottom}%`, height: `${bandHeight}%` }}
        />
      ) : null}
      <HStack className="h-full items-end" style={{ gap: 2 }}>
        {points.map((p, i) => {
          const h = 4 + ((p.value - min) / range) * (height - 4);
          return (
            <VStack
              key={i}
              className={cx("flex-1 min-w-[3px] rounded-[5px]", inRange(p.value) ? "bg-text3" : "bg-fg")}
              style={{ height: h }}
            />
          );
        })}
      </HStack>
    </VStack>
  );
}
