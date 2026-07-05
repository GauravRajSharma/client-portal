import { useMemo, useState } from "react";
import { Search, C } from "@/components/ui/icons";
import { router, useGlobalSearchParams } from "expo-router";
import { HStack, VStack, Text, Input, useMedia } from "@/components/ui/gs";
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
      <HStack className="items-center gap-[10px] bg-surface border border-borderStrong rounded-[14px] px-[15px] h-[48px]">
        <Search size={18} color={C.text3} />
        <Input
          className="flex-1 text-[14.5px] text-fg font-plex"
          placeholder="Search by test name…"
          placeholderTextColor={C.text3}
          value={search}
          onChangeText={setSearch}
        />
      </HStack>

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
        <VStack className="gap-[23px]">
          {groups.map((g) => (
            <VStack key={g.date} className="gap-[10px]">
              <HStack className="items-center justify-between px-[1px]">
                <Text className="text-[15px] font-plex-bold text-fg">{g.date}</Text>
                <Text className="text-[12px] text-text2">
                  {g.items.length} result{g.items.length > 1 ? "s" : ""}
                </Text>
              </HStack>
              <VStack className={media.md ? "flex-row flex-wrap gap-[10px]" : "gap-[10px]"}>
                {g.items.map((r) => (
                  <VStack key={r.id} className={media.md ? "w-[48.5%]" : undefined}>
                    <ResultRow result={r} onPress={() => open(r)} />
                  </VStack>
                ))}
              </VStack>
            </VStack>
          ))}
        </VStack>
      )}
    </DLScreen>
  );
}
