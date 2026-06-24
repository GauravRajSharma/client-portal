import { FlaskConical } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
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
      <DLBack label="Visit" onPress={() => router.back()} />

      <XStack items="flex-end" justify="space-between" gap="$3" px="$0.5">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Visit results
        </Text>
        {data && data.length > 0 ? (
          <Text fontSize={12.5} color="$text2" pb="$1">
            {attention.length > 0
              ? `${attention.length} of ${data.length} need attention`
              : `${data.length} ${data.length === 1 ? "result" : "results"}`}
          </Text>
        ) : null}
      </XStack>

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
        <YStack gap="$2.5">
          {data.map((result) => (
            <ResultRow
              key={result.id}
              result={result}
              onPress={() => router.push(`/patient/${uuid}/results/${encodeURIComponent(result.name)}` as any)}
            />
          ))}
        </YStack>
      )}
    </DLScreen>
  );
}
