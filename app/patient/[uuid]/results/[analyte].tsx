import { useMemo } from "react";
import { ArrowLeft, FlaskConical, C } from "@/components/ui/icons";
import { useLocalSearchParams } from "expo-router";
import { backOr } from "@/utils/nav";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
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
  const { uuid, analyte } = useLocalSearchParams<{ uuid: string; analyte: string }>();
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
          color: dlStatus(r.status).hex,
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
      <Pressable
        onPress={() => backOr(`/patient/${uuid}/results`)}
        className="flex-row items-center gap-[7px] active:opacity-60"
      >
        <ArrowLeft size={18} color={C.text2} />
        <Text className="text-[14px] font-plex-medium text-text2">Results</Text>
      </Pressable>

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
        <VStack className="gap-[15px]">
          {/* Hero: latest value + status + range bar */}
          <DLCard className="p-[23px] gap-[17px]">
            <VStack className="gap-[2px]">
              <Text className="text-[13px] text-text2">{name}</Text>
              <HStack className="items-end justify-between gap-[12px]">
                <HStack className="items-baseline gap-[7px]">
                  <Text className={`text-[48px] font-plex-bold font-plex-mono tracking-[-2px] ${m.text}`}>
                    {latest.value}
                  </Text>
                  {latest.unit ? (
                    <Text className="text-[16px] text-text2 font-plex-medium">{latest.unit}</Text>
                  ) : null}
                </HStack>
                <DLStatusPill label={m.label} text={m.text} softBg={m.softBg} hex={m.hex} />
              </HStack>
            </VStack>
            {refText ? (
              <VStack className="gap-[7px]">
                <RangeBar
                  value={latest.numericValue}
                  low={latest.referenceLow}
                  high={latest.referenceHigh}
                  color={m.hex}
                />
                <HStack className="justify-between">
                  <Text className="text-[11px] text-text3 font-plex-mono">{latest.referenceLow}</Text>
                  <Text className="text-[11px] text-text2">Normal zone</Text>
                  <Text className="text-[11px] text-text3 font-plex-mono">{latest.referenceHigh}</Text>
                </HStack>
              </VStack>
            ) : null}
          </DLCard>

          {/* Trend chart */}
          {points.length > 1 ? (
            <DLCard className="p-[17px] gap-[7px]">
              <Text className="text-[14.5px] font-plex-bold text-fg">Historical trend</Text>
              <LineChart
                points={points}
                low={latest.referenceLow}
                high={latest.referenceHigh}
                height={180}
              />
            </DLCard>
          ) : (
            <Text className="text-[12.5px] text-text3 px-[2px]">
              A trend appears once you have more than one result for this test.
            </Text>
          )}

          {/* History */}
          <DLCard className="overflow-hidden">
            <Text className="text-[14.5px] font-plex-bold text-fg px-[17px] pt-[15px] pb-[7px]">
              Result history
            </Text>
            {newest.map((r: LabResult, i) => {
              const rm = dlStatus(r.status);
              return (
                <HStack
                  key={r.id}
                  className="items-center justify-between gap-[12px] px-[17px] py-[12px] border-t border-border"
                >
                  <Text className="text-[12.5px] text-text2">{(r.takenAt ?? "").slice(0, 10)}</Text>
                  <HStack className="items-center gap-[12px]">
                    <Text className={`text-[15px] font-plex-semibold font-plex-mono ${rm.text}`}>
                      {r.value}
                      {r.unit ? (
                        <Text className="text-[10.5px] text-text3 font-plex"> {r.unit}</Text>
                      ) : null}
                    </Text>
                    <DLStatusPill label={rm.label} text={rm.text} softBg={rm.softBg} hex={rm.hex} size="sm" />
                  </HStack>
                </HStack>
              );
            })}
          </DLCard>
        </VStack>
      )}
    </DLScreen>
  );
}
