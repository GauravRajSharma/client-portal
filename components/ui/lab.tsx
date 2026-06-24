import { Text, Theme, XStack, YStack } from "tamagui";
import type { LabResult, LabTrendPoint } from "@/server/dto";
import { labStatusMeta } from "./status";
import { Row, StatusPill } from "./primitives";

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
  theme: "success" | "warning" | "error" | "accent" | "neutral";
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

  // The marker carries the status: in-range reads calm and dark; out-of-range is
  // pulled into the status theme and made taller/wider so it is the first thing seen.
  const marker = (
    <YStack height={10} bg="$color3" rounded="$10" overflow="hidden" position="relative">
      {/* the "normal" band, so a patient can see where in-range sits */}
      <YStack
        position="absolute"
        t={3}
        height={4}
        l={`${bandLeft}%`}
        width={`${bandWidth}%`}
        rounded="$10"
        bg="$color6"
      />
      <YStack
        position="absolute"
        height="100%"
        width={attention ? 4 : 3}
        l={`${markerPct}%`}
        rounded="$10"
        bg={attention ? "$color10" : "$color12"}
      />
    </YStack>
  );

  if (attention && theme !== "neutral") {
    return <Theme name={theme}>{marker}</Theme>;
  }
  return marker;
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
    <Row onPress={onPress} flexDirection="column" items="stretch" gap="$2.5" minH={64}>
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack flex={1} gap="$2">
          {/* Status first: plain-language verdict leads, before the number. */}
          <StatusPill label={meta.label} theme={meta.theme} Icon={meta.Icon} size="sm" />
          <Text fontSize="$4" fontWeight="600" color="$color12" numberOfLines={2}>
            {result.name}
          </Text>
          {refText ? (
            <Text fontSize="$2" color="$color9">
              Normal {refText}
            </Text>
          ) : null}
        </YStack>
        <XStack items="baseline" gap="$1">
          <Text
            fontSize="$8"
            fontWeight="800"
            color={meta.attention ? "$color12" : "$color11"}
            fontVariant={["tabular-nums"]}
          >
            {result.value}
          </Text>
          {result.unit ? (
            <Text fontSize="$2" color="$color9">
              {result.unit}
            </Text>
          ) : null}
        </XStack>
      </XStack>
      <RangeBar
        value={result.numericValue}
        low={result.referenceLow}
        high={result.referenceHigh}
        theme={meta.theme}
        attention={meta.attention}
      />
    </Row>
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
    <YStack height={height} position="relative">
      {showBand ? (
        <YStack
          position="absolute"
          l={0}
          r={0}
          b={`${bandBottom}%`}
          height={`${bandHeight}%`}
          bg="$color4"
          rounded="$2"
        />
      ) : null}
      <XStack height="100%" items="flex-end" gap={2}>
        {points.map((p, i) => {
          const h = 4 + ((p.value - min) / range) * (height - 4);
          return (
            <YStack
              key={i}
              flex={1}
              height={h}
              minW={3}
              rounded="$2"
              bg={inRange(p.value) ? "$color8" : "$color11"}
            />
          );
        })}
      </XStack>
    </YStack>
  );
}
