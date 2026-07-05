import { FlaskConical } from "@/components/ui/icons";
import { router, useLocalSearchParams } from "expo-router";
import { backOr } from "@/utils/nav";
import { HStack, VStack, Text } from "@/components/ui/gs";
import {
  DLBack,
  DLScreen,
  EmptyState,
  ErrorState,
  ResultRow,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

export default function VisitLabResults() {
  const { uuid, visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientLabResults.useQuery({ visit });

  const attention = (data ?? []).filter((r) => r.status !== "normal" && r.status !== "unknown");

  return (
    <DLScreen>
      <DLBack label="Visit" onPress={() => backOr(`/patient/${uuid}/${visit}`)} />

      <HStack className="items-end justify-between gap-[12px] px-[1px]">
        <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px]">Visit results</Text>
        {data && data.length > 0 ? (
          <Text className="text-[12.5px] text-text2 pb-[2px]">
            {attention.length > 0
              ? `${attention.length} of ${data.length} need attention`
              : `${data.length} ${data.length === 1 ? "result" : "results"}`}
          </Text>
        ) : null}
      </HStack>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={FlaskConical}
          title="No results for this visit"
          detail="When the lab finishes your tests for this visit, they will appear here."
        />
      ) : (
        <VStack className="gap-[10px]">
          {data.map((result) => (
            <ResultRow
              key={result.id}
              result={result}
              onPress={() => router.push(`/patient/${uuid}/results/${encodeURIComponent(result.name)}` as any)}
            />
          ))}
        </VStack>
      )}
    </DLScreen>
  );
}
