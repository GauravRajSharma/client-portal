import { ArrowLeft, FlaskConical } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import {
  EmptyState,
  ErrorState,
  LabValueRow,
  Panel,
  Screen,
  Section,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

/** A quiet back affordance. The visit lab screen is reached from Visits. */
function BackBar({ label = "Back to visit" }: { label?: string }) {
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

export default function VisitLabResults() {
  const { uuid, visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const query = trpc.patientLabResults.useQuery({ visit });
  const { data, isLoading, isError, refetch } = query;

  const attention = (data ?? []).filter(
    (r) => r.status !== "normal" && r.status !== "unknown",
  );

  return (
    <Screen>
      <BackBar />
      <Section
        title="Results for this visit"
        action={
          data && data.length > 0 ? (
            <Text fontSize="$2" color="$color9">
              {attention.length > 0
                ? `${attention.length} of ${data.length} need attention`
                : `${data.length} ${data.length === 1 ? "result" : "results"}`}
            </Text>
          ) : null
        }
      >
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
          <Panel gap="$1">
            {data.map((result, i) => (
              <YStack key={result.id}>
                {i > 0 ? <YStack height={1} bg="$borderColor" /> : null}
                <LabValueRow
                  result={result}
                  onPress={() =>
                    router.push(
                      `/patient/${uuid}/results/${encodeURIComponent(result.name)}` as any,
                    )
                  }
                />
              </YStack>
            ))}
          </Panel>
        )}
      </Section>
    </Screen>
  );
}
