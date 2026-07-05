import { Activity, Check } from "@/components/ui/icons";
import { router, useLocalSearchParams } from "expo-router";
import { HStack, VStack, Text } from "@/components/ui/gs";
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
  const dotBg =
    step.status === "completed" ? "bg-good" : step.status === "current" ? "bg-primary" : "bg-surface";
  return (
    <HStack className="gap-[12px] items-start">
      <VStack className="items-center">
        <VStack
          className={`w-[24px] h-[24px] rounded-[20px] items-center justify-center ${dotBg} ${step.status === "pending" ? "border-2 border-border" : ""}`}
        >
          {step.status === "completed" ? (
            <Check size={13} color="#fff" />
          ) : step.status === "current" ? (
            <VStack className="w-[7px] h-[7px] rounded-[10px] bg-onPrimary" />
          ) : null}
        </VStack>
        {!last ? (
          <VStack className={`w-[2px] h-[26px] ${step.status === "completed" ? "bg-good" : "bg-border"}`} />
        ) : null}
      </VStack>
      <VStack className={`flex-1 gap-[1px] ${last ? "pb-0" : "pb-[17px]"}`}>
        <HStack className="items-center justify-between gap-[7px]">
          <Text
            className={`text-[14.5px] font-plex-bold ${step.status === "pending" ? "text-text2" : "text-fg"}`}
          >
            {step.label}
          </Text>
          {step.at ? (
            <Text className="text-[11px] text-text3 font-plex-mono">
              {fmtWhen(step.at)}
            </Text>
          ) : null}
        </HStack>
        {step.detail ? (
          <Text
            className={`text-[12.5px] leading-[17px] ${step.status === "pending" ? "text-text3" : "text-text2"}`}
          >
            {step.detail}
          </Text>
        ) : null}
        {step.status === "current" && showHere ? (
          <HStack className="items-center gap-[4px] mt-[2px]">
            <VStack className="w-[6px] h-[6px] rounded-[10px] bg-primary" />
            <Text className="text-[11.5px] text-primary font-plex-bold">
              You are here now
            </Text>
          </HStack>
        ) : null}
      </VStack>
    </HStack>
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
        <VStack className="gap-[15px]">
          <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px] px-[1px]">
            Care in progress
          </Text>

          <CareCard care={data} />

          {data.pending.lab + data.pending.radiology + data.pending.procedure + data.pending.medication > 0 ? (
            <DLCard className="p-[17px] gap-[10px]">
              <Text className="text-[14.5px] font-plex-bold text-fg">
                What's still pending
              </Text>
              <CarePending pending={data.pending} />
            </DLCard>
          ) : null}

          <DLCard className="p-[17px] gap-[2px]">
            <Text className="text-[14.5px] font-plex-bold text-fg pb-[7px]">
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

          <Text className="text-[11.5px] text-text3 text-center px-[17px]">
            This is a live, read-only view of your visit. It updates as the hospital records your care.
          </Text>
        </VStack>
      )}
    </DLScreen>
  );
}
