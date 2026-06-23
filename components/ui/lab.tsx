import { Text, XStack, YStack } from "tamagui";
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
  attention,
}: {
  value?: number;
  low?: number;
  high?: number;
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

  return (
    <YStack height={6} bg="$color3" rounded="$10" overflow="hidden" position="relative">
      <YStack
        position="absolute"
        height="100%"
        l={`${bandLeft}%`}
        width={`${bandWidth}%`}
        bg="$color5"
      />
      <YStack
        position="absolute"
        height="100%"
        width={3}
        l={`${markerPct}%`}
        bg={attention ? "$color9" : "$color11"}
      />
    </YStack>
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
    <Row onPress={onPress} flexDirection="column" items="stretch" gap="$2">
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color12" numberOfLines={2}>
            {result.name}
          </Text>
          {refText ? (
            <Text fontSize="$2" color="$color9">
              Reference {refText}
            </Text>
          ) : null}
        </YStack>
        <YStack items="flex-end" gap="$1.5">
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
          <StatusPill label={meta.label} theme={meta.theme} Icon={meta.Icon} size="sm" />
        </YStack>
      </XStack>
      <RangeBar
        value={result.numericValue}
        low={result.referenceLow}
        high={result.referenceHigh}
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
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const inRange = (v: number) =>
    (low === undefined || v >= low) && (high === undefined || v <= high);

  return (
    <XStack height={height} items="flex-end" gap={2}>
      {points.map((p, i) => {
        const h = 4 + ((p.value - min) / range) * (height - 4);
        return (
          <YStack
            key={i}
            flex={1}
            height={h}
            minW={3}
            rounded="$2"
            bg={inRange(p.value) ? "$color7" : "$color10"}
          />
        );
      })}
    </XStack>
  );
}
