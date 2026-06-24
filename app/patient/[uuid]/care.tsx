import { Activity, Check } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import type { CareStep } from "@/server/dto";
import {
  CareCard,
  CarePending,
  DLBack,
  DLCard,
  DLScreen,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

/** Compact "Jun 23, 9:02 AM" from an ISO timestamp; falls back to the raw date. */
function fmtWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  try {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function StepRow({ step, last, showHere }: { step: CareStep; last: boolean; showHere: boolean }) {
  const color = step.status === "completed" ? "$good" : step.status === "current" ? "$primary" : "$text3";
  return (
    <XStack gap="$3" items="flex-start">
      <YStack items="center">
        <YStack
          width={24}
          height={24}
          rounded={20}
          bg={step.status === "completed" ? "$good" : step.status === "current" ? "$primary" : "$surface"}
          borderWidth={step.status === "pending" ? 2 : 0}
          borderColor="$border"
          items="center"
          justify="center"
        >
          {step.status === "completed" ? (
            <Check size={13} color="#fff" />
          ) : step.status === "current" ? (
            <YStack width={7} height={7} rounded={10} bg="$onPrimary" />
          ) : null}
        </YStack>
        {!last ? <YStack width={2} height={26} bg={step.status === "completed" ? "$good" : "$border"} /> : null}
      </YStack>
      <YStack flex={1} pb={last ? "$0" : "$4"} gap="$0.5">
        <XStack items="center" justify="space-between" gap="$2">
          <Text fontSize={14.5} fontWeight={step.status === "current" ? "800" : "700"} color={step.status === "pending" ? "$text2" : "$color12"}>
            {step.label}
          </Text>
          {step.at ? (
            <Text fontSize={11} color="$text3" fontFamily="$mono">
              {fmtWhen(step.at)}
            </Text>
          ) : null}
        </XStack>
        {step.detail ? (
          <Text fontSize={12.5} color={step.status === "pending" ? "$text3" : "$text2"} lineHeight={17}>
            {step.detail}
          </Text>
        ) : null}
        {step.status === "current" && showHere ? (
          <XStack items="center" gap="$1.5" mt="$1">
            <YStack width={6} height={6} rounded={10} bg="$primary" />
            <Text fontSize={11.5} color="$primary" fontWeight="700">
              You are here now
            </Text>
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  );
}

export default function Care() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientCareStatus.useQuery();

  return (
    <DLScreen>
      <DLBack label="Home" onPress={() => router.replace(`/patient/${uuid}/home` as any)} />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.active ? (
        <EmptyState
          Icon={Activity}
          title="No visit in progress"
          detail="When you are admitted or seen at the hospital, your live visit progress will show here."
        />
      ) : (
        <YStack gap="$3.5">
          <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4} px="$0.5">
            Care in progress
          </Text>

          <CareCard care={data} />

          {data.pending.lab + data.pending.radiology + data.pending.procedure + data.pending.medication > 0 ? (
            <DLCard p="$4" gap="$2.5">
              <Text fontSize={14.5} fontWeight="700" color="$color12">
                What's still pending
              </Text>
              <CarePending pending={data.pending} />
            </DLCard>
          ) : null}

          <DLCard p="$4" gap="$1">
            <Text fontSize={14.5} fontWeight="700" color="$color12" pb="$2">
              Your visit journey
            </Text>
            {(() => {
              const firstCurrent = data.steps.findIndex((s) => s.status === "current");
              return data.steps.map((s, i) => (
                <StepRow
                  key={s.key}
                  step={s}
                  last={i === data.steps.length - 1}
                  showHere={i === firstCurrent}
                />
              ));
            })()}
          </DLCard>

          <Text fontSize={11.5} color="$text3" text="center" px="$4">
            This is a live, read-only view of your visit. It updates as the hospital records your care.
          </Text>
        </YStack>
      )}
    </DLScreen>
  );
}
