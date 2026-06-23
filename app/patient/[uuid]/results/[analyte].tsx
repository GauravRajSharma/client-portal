import { useMemo } from "react";
import { ArrowLeft, FlaskConical } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import type { LabResult } from "@/server/dto";
import { toLabTrends } from "@/server/adapters";
import {
  DateText,
  EmptyState,
  ErrorState,
  Panel,
  Screen,
  Section,
  SkeletonList,
  Sparkline,
  StatusPill,
  labStatusMeta,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

function BackBar({ label = "Back to results" }: { label?: string }) {
  return (
    <XStack
      items="center"
      gap="$2"
      py="$2.5"
      minH={44}
      pressStyle={{ opacity: 0.6 }}
      hoverStyle={{ opacity: 0.8 }}
      onPress={() => router.back()}
      cursor="pointer"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ArrowLeft size={18} color="$color10" />
      <Text fontSize="$3" fontWeight="600" color="$color10">
        {label}
      </Text>
    </XStack>
  );
}

/** One row of the points table: date, value+unit, plain-language status. */
function PointRow({ result, last }: { result: LabResult; last: boolean }) {
  const meta = labStatusMeta(result.status);
  return (
    <YStack>
      {!last ? <YStack height={1} bg="$borderColor" /> : null}
      <XStack items="center" justify="space-between" gap="$3" py="$3" px="$1">
        <DateText value={result.takenAt} color="$color10" />
        <XStack items="center" gap="$3" flex={1} justify="flex-end">
          <Text
            fontSize="$5"
            fontWeight="700"
            color={meta.attention ? "$color12" : "$color11"}
            fontVariant={["tabular-nums"]}
          >
            {result.value}
            {result.unit ? (
              <Text fontSize="$2" color="$color9">
                {" "}
                {result.unit}
              </Text>
            ) : null}
          </Text>
          <StatusPill
            label={meta.label}
            theme={meta.theme}
            Icon={meta.Icon}
            size="sm"
          />
        </XStack>
      </XStack>
    </YStack>
  );
}

export default function AnalyteTrend() {
  const { analyte } = useLocalSearchParams<{ uuid: string; analyte: string }>();
  const name = decodeURIComponent(analyte ?? "");
  const { data, isLoading, isError, refetch } =
    trpc.patientAllLabResults.useQuery();

  // Newest-first for the table; the Sparkline series is built oldest-first by the adapter.
  const series = useMemo(
    () => (data ?? []).filter((r) => r.name === name),
    [data, name],
  );
  const newest = useMemo(
    () =>
      [...series].sort((a, b) => {
        const ta = a.takenAt ? new Date(a.takenAt).getTime() : 0;
        const tb = b.takenAt ? new Date(b.takenAt).getTime() : 0;
        return tb - ta;
      }),
    [series],
  );
  const trend = useMemo(() => toLabTrends(series)[0], [series]);

  const refText =
    trend?.referenceLow !== undefined && trend?.referenceHigh !== undefined
      ? `${trend.referenceLow}–${trend.referenceHigh}${trend.unit ? ` ${trend.unit}` : ""}`
      : undefined;

  return (
    <Screen>
      <BackBar />
      <Section title={name || "Trend"}>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : series.length === 0 ? (
          <EmptyState
            Icon={FlaskConical}
            title="No history for this test"
            detail="We could not find earlier results for this test. It may be your first one."
          />
        ) : (
          <YStack gap="$4">
            {refText ? (
              <Text fontSize="$3" color="$color10">
                Normal range {refText}. Bars left to right show oldest to newest.
              </Text>
            ) : (
              <Text fontSize="$3" color="$color10">
                Bars left to right show oldest to newest.
              </Text>
            )}

            {trend && trend.points.length > 1 ? (
              <Panel>
                <Sparkline
                  points={trend.points}
                  height={72}
                  low={trend.referenceLow}
                  high={trend.referenceHigh}
                />
              </Panel>
            ) : (
              <Text fontSize="$2" color="$color9">
                A trend appears once you have more than one result for this test.
              </Text>
            )}

            <Panel gap="$1">
              {newest.map((r, i) => (
                <PointRow
                  key={r.id}
                  result={r}
                  last={i === newest.length - 1}
                />
              ))}
            </Panel>
          </YStack>
        )}
      </Section>
    </Screen>
  );
}
