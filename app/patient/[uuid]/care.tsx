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

function StepRow({ step, last }: { step: CareStep; last: boolean }) {
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
      <YStack flex={1} pb={last ? "$0" : "$3"}>
        <Text fontSize={14.5} fontWeight={step.status === "current" ? "800" : "600"} color={step.status === "pending" ? "$text2" : "$color12"}>
          {step.label}
        </Text>
        {step.status === "current" ? (
          <Text fontSize={12} color="$primary" fontWeight="600" mt="$0.5">
            You are here
          </Text>
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
            {data.steps.map((s, i) => (
              <StepRow key={s.key} step={s} last={i === data.steps.length - 1} />
            ))}
          </DLCard>

          <Text fontSize={11.5} color="$text3" text="center" px="$4">
            This is a live, read-only view of your visit. It updates as the hospital records your care.
          </Text>
        </YStack>
      )}
    </DLScreen>
  );
}
