import { useMemo } from "react";
import { ArrowLeft, FlaskConical } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import type { LabResult } from "@/server/dto";
import {
  DLCard,
  DLScreen,
  DLStatusPill,
  EmptyState,
  ErrorState,
  LineChart,
  RangeBar,
  SkeletonList,
  dlStatus,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

export default function AnalyteTrend() {
  const { analyte } = useLocalSearchParams<{ uuid: string; analyte: string }>();
  const name = decodeURIComponent(analyte ?? "");
  const { data, isLoading, isError, refetch } = trpc.patientAllLabResults.useQuery();

  const series = useMemo(() => (data ?? []).filter((r) => r.name === name), [data, name]);
  const newest = useMemo(
    () => [...series].sort((a, b) => ((a.takenAt ?? "") > (b.takenAt ?? "") ? -1 : 1)),
    [series],
  );
  const points = useMemo(
    () =>
      [...series]
        .filter((r) => r.numericValue != null && r.takenAt)
        .sort((a, b) => (a.takenAt! < b.takenAt! ? -1 : 1))
        .map((r) => ({
          label: (r.takenAt ?? "").slice(5, 10),
          value: r.numericValue as number,
          color: dlStatus(r.status).color,
        })),
    [series],
  );

  const latest = newest[0];
  const m = latest ? dlStatus(latest.status) : null;
  const refText =
    latest?.referenceLow != null && latest?.referenceHigh != null
      ? `${latest.referenceLow}–${latest.referenceHigh}${latest.unit ? ` ${latest.unit}` : ""}`
      : undefined;

  return (
    <DLScreen>
      <XStack items="center" gap="$2" onPress={() => router.back()} pressStyle={{ opacity: 0.6 }}>
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Results
        </Text>
      </XStack>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !latest || !m ? (
        <EmptyState
          Icon={FlaskConical}
          title="No history for this test"
          detail="We could not find results for this test."
        />
      ) : (
        <YStack gap="$3.5">
          {/* Hero: latest value + status + range bar */}
          <DLCard p="$5" gap="$4">
            <YStack gap="$1">
              <Text fontSize={13} color="$text2">
                {name}
              </Text>
              <XStack items="flex-end" justify="space-between" gap="$3">
                <XStack items="baseline" gap="$2">
                  <Text fontSize={48} fontWeight="700" fontFamily="$mono" color={m.color as any} letterSpacing={-2}>
                    {latest.value}
                  </Text>
                  {latest.unit ? (
                    <Text fontSize={16} color="$text2" fontWeight="500">
                      {latest.unit}
                    </Text>
                  ) : null}
                </XStack>
                <DLStatusPill label={m.label} color={m.color} soft={m.soft} />
              </XStack>
            </YStack>
            {refText ? (
              <YStack gap="$2">
                <RangeBar
                  value={latest.numericValue}
                  low={latest.referenceLow}
                  high={latest.referenceHigh}
                  color={m.color}
                />
                <XStack justify="space-between">
                  <Text fontSize={11} color="$text3" fontFamily="$mono">
                    {latest.referenceLow}
                  </Text>
                  <Text fontSize={11} color="$text2">
                    Normal zone
                  </Text>
                  <Text fontSize={11} color="$text3" fontFamily="$mono">
                    {latest.referenceHigh}
                  </Text>
                </XStack>
              </YStack>
            ) : null}
          </DLCard>

          {/* Trend chart */}
          {points.length > 1 ? (
            <DLCard p="$4" gap="$2">
              <Text fontSize={14.5} fontWeight="700" color="$color12">
                Historical trend
              </Text>
              <LineChart
                points={points}
                low={latest.referenceLow}
                high={latest.referenceHigh}
                height={180}
              />
            </DLCard>
          ) : (
            <Text fontSize={12.5} color="$text3" px="$1">
              A trend appears once you have more than one result for this test.
            </Text>
          )}

          {/* History */}
          <DLCard overflow="hidden">
            <Text fontSize={14.5} fontWeight="700" color="$color12" px="$4" pt="$3.5" pb="$2">
              Result history
            </Text>
            {newest.map((r: LabResult, i) => {
              const rm = dlStatus(r.status);
              return (
                <XStack
                  key={r.id}
                  items="center"
                  justify="space-between"
                  gap="$3"
                  px="$4"
                  py="$3"
                  borderTopWidth={1}
                  borderColor="$border"
                >
                  <Text fontSize={12.5} color="$text2">
                    {(r.takenAt ?? "").slice(0, 10)}
                  </Text>
                  <XStack items="center" gap="$3">
                    <Text fontSize={15} fontWeight="600" fontFamily="$mono" color={rm.color as any}>
                      {r.value}
                      {r.unit ? (
                        <Text fontSize={10.5} color="$text3" fontFamily="$body">
                          {" "}
                          {r.unit}
                        </Text>
                      ) : null}
                    </Text>
                    <DLStatusPill label={rm.label} color={rm.color} soft={rm.soft} size="sm" />
                  </XStack>
                </XStack>
              );
            })}
          </DLCard>
        </YStack>
      )}
    </DLScreen>
  );
}
