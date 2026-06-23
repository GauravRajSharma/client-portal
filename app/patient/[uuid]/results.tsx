import { useMemo, useState } from "react";
import { FlaskConical } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack, useMedia } from "tamagui";
import type { LabResult } from "@/server/dto";
import {
  DateText,
  EmptyState,
  ErrorState,
  LabValueRow,
  Panel,
  Screen,
  Section,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

const needsAttention = (r: LabResult) =>
  r.status !== "normal" && r.status !== "unknown";

/** Toggle pill: filter the list down to out-of-range results. */
function AttentionToggle({
  on,
  count,
  onToggle,
}: {
  on: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <XStack
      items="center"
      gap="$2"
      px="$3.5"
      py="$2"
      minH={40}
      rounded="$10"
      borderWidth={1}
      borderColor={on ? "$accent7" : "$borderColor"}
      bg={on ? "$accent4" : "transparent"}
      hoverStyle={{ bg: on ? "$accent5" : "$color2" }}
      pressStyle={{ opacity: 0.7 }}
      animation="quick"
      onPress={onToggle}
      cursor="pointer"
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Show only results that need attention"
    >
      <Text
        fontSize="$3"
        fontWeight="700"
        color={on ? "$accent11" : "$color11"}
      >
        Needs attention
      </Text>
      {count > 0 ? (
        <YStack
          minW={20}
          height={20}
          px="$1.5"
          rounded="$10"
          items="center"
          justify="center"
          bg={on ? "$accent9" : "$color5"}
        >
          <Text fontSize={11} fontWeight="800" color={on ? "#fff" : "$color11"}>
            {count}
          </Text>
        </YStack>
      ) : null}
    </XStack>
  );
}

/** A date heading + the results recorded on that day. */
function DateGroup({
  date,
  results,
  onOpen,
}: {
  date: string;
  results: LabResult[];
  onOpen: (r: LabResult) => void;
}) {
  const media = useMedia();
  // Web (>=768): a wrapping two-up grid (reads left-to-right, then down) for density.
  // Mobile: single stacked list. Wrapping keeps natural reading order, unlike a
  // round-robin column split.
  const twoUp = media.md;

  return (
    <YStack gap="$2.5">
      <XStack items="center" gap="$2">
        <DateText value={date} fontWeight="700" color="$color11" />
        <YStack flex={1} height={1} bg="$borderColor" />
        <Text fontSize="$2" color="$color9">
          {results.length} {results.length === 1 ? "result" : "results"}
        </Text>
      </XStack>
      <XStack flexWrap="wrap" gap="$3" justify={twoUp ? "space-between" : "flex-start"}>
        {results.map((r) => (
          <YStack key={r.id} width={twoUp ? "48.5%" : "100%"} minW={260} grow={1}>
            <Panel p="$3" gap={0}>
              <LabValueRow result={r} onPress={() => onOpen(r)} />
            </Panel>
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
}

/** Group results by day (most recent first); preserve insertion order within a day. */
function groupByDay(results: LabResult[]) {
  const byDay = new Map<string, LabResult[]>();
  for (const r of results) {
    const key = r.takenAt ? r.takenAt.slice(0, 10) : "unknown";
    const list = byDay.get(key) ?? [];
    list.push(r);
    byDay.set(key, list);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([day, list]) => ({
      day,
      date: list[0]?.takenAt ?? day,
      results: list,
    }));
}

export default function Results() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [onlyAttention, setOnlyAttention] = useState(false);
  const { data, isLoading, isError, refetch } =
    trpc.patientAllLabResults.useQuery();

  const attentionCount = useMemo(
    () => (data ?? []).filter(needsAttention).length,
    [data],
  );

  const groups = useMemo(() => {
    const list = data ?? [];
    const filtered = onlyAttention ? list.filter(needsAttention) : list;
    return groupByDay(filtered);
  }, [data, onlyAttention]);

  const openTrend = (r: LabResult) =>
    router.push(
      `/patient/${uuid}/results/${encodeURIComponent(r.name)}` as any,
    );

  const total = data?.length ?? 0;

  return (
    <Screen>
      <Section
        title="Lab results"
        action={
          total > 0 ? (
            <AttentionToggle
              on={onlyAttention}
              count={attentionCount}
              onToggle={() => setOnlyAttention((v) => !v)}
            />
          ) : null
        }
      >
        {total > 0 ? (
          <Text fontSize="$3" color="$color10">
            {attentionCount > 0
              ? `${attentionCount} of ${total} need a closer look. Tap any result to see how it has changed over time.`
              : `All ${total} of your results are in the normal range. Tap any result to see its trend.`}
          </Text>
        ) : null}

        {isLoading ? (
          <SkeletonList count={5} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : total === 0 ? (
          <EmptyState
            Icon={FlaskConical}
            title="No results yet"
            detail="When the lab finishes your tests, your results will appear here, newest first."
          />
        ) : onlyAttention && groups.length === 0 ? (
          <EmptyState
            Icon={FlaskConical}
            title="Nothing needs attention"
            detail="None of your results are outside their normal range right now."
          />
        ) : (
          <YStack gap="$5">
            {groups.map((g) => (
              <DateGroup
                key={g.day}
                date={g.date}
                results={g.results}
                onOpen={openTrend}
              />
            ))}
          </YStack>
        )}
      </Section>
    </Screen>
  );
}
