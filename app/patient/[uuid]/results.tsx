import { useMemo, useState } from "react";
import { Search } from "@tamagui/lucide-icons";
import { router, useGlobalSearchParams } from "expo-router";
import { Input, Text, XStack, YStack, useMedia } from "tamagui";
import { trpc } from "@/utils/trpc";
import type { LabResult } from "@/server/dto";
import {
  DLScreen,
  DLTitle,
  DeptChips,
  EmptyState,
  ErrorState,
  ResultRow,
  SkeletonList,
} from "@/components/ui";

export default function Results() {
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const media = useMedia();
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = trpc.patientAllLabResults.useQuery();

  const { groups, total, attentionCount } = useMemo(() => {
    const all = (data ?? []).slice();
    const attention = all.filter((r) => r.status !== "normal" && r.status !== "unknown");
    const q = search.trim().toLowerCase();
    let rows = filter === "attention" ? attention : all;
    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    rows.sort((a, b) => ((a.takenAt ?? "") > (b.takenAt ?? "") ? -1 : 1));
    // group by collection date
    const byDate = new Map<string, LabResult[]>();
    for (const r of rows) {
      const k = (r.takenAt ?? "Undated").slice(0, 10);
      const list = byDate.get(k) ?? [];
      list.push(r);
      byDate.set(k, list);
    }
    return {
      groups: Array.from(byDate, ([date, items]) => ({ date, items })),
      total: all.length,
      attentionCount: attention.length,
    };
  }, [data, filter, search]);

  const open = (r: LabResult) =>
    router.push(`/patient/${uuid}/results/${encodeURIComponent(r.name)}` as any);

  return (
    <DLScreen>
      <DLTitle title="Results" subtitle="Your lab tests, newest first." />
      <XStack
        items="center"
        gap="$2.5"
        bg="$surface"
        borderWidth={1}
        borderColor="$borderStrong"
        rounded={14}
        px="$3.5"
        height={48}
      >
        <Search size={18} color="$text3" />
        <Input
          unstyled
          flex={1}
          fontSize={14.5}
          color="$color12"
          placeholder="Search by test name…"
          placeholderTextColor="$text3"
          value={search}
          onChangeText={setSearch}
        />
      </XStack>

      <DeptChips
        items={[
          { key: "all", label: `All ${total}` },
          { key: "attention", label: `Needs attention ${attentionCount}` },
        ]}
        value={filter}
        onChange={(k) => setFilter(k as "all" | "attention")}
      />

      {isError ? (
        <ErrorState
          title="Couldn't load your results"
          detail="Please try again in a moment."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <SkeletonList count={5} />
      ) : groups.length === 0 ? (
        <EmptyState
          Icon={Search}
          title={search || filter === "attention" ? "Nothing matches" : "No results yet"}
          detail={
            search || filter === "attention"
              ? "Try a different search or filter."
              : "When the lab finishes your tests, results appear here."
          }
        />
      ) : (
        <YStack gap="$5">
          {groups.map((g) => (
            <YStack key={g.date} gap="$2.5">
              <XStack items="center" justify="space-between" px="$0.5">
                <Text fontSize={15} fontWeight="700" color="$color12">
                  {g.date}
                </Text>
                <Text fontSize={12} color="$text2">
                  {g.items.length} result{g.items.length > 1 ? "s" : ""}
                </Text>
              </XStack>
              <YStack
                gap="$2.5"
                {...(media.md ? { flexDirection: "row", flexWrap: "wrap" } : {})}
              >
                {g.items.map((r) => (
                  <YStack key={r.id} {...(media.md ? { width: "48.5%" } : {})}>
                    <ResultRow result={r} onPress={() => open(r)} />
                  </YStack>
                ))}
              </YStack>
            </YStack>
          ))}
        </YStack>
      )}
    </DLScreen>
  );
}
