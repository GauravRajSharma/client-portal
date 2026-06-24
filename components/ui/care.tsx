/**
 * "Care in progress" panel — a read-only, ride-share-style live view of where the
 * patient is in their current hospital visit. Driven by CareStatus (see server/dto).
 */
import { Check, ChevronRight, FlaskConical, Pill, Radiation, Stethoscope } from "@tamagui/lucide-icons";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import type { CareStatus, CareStep } from "@/server/dto";

function StepDot({ status }: { status: CareStep["status"] }) {
  if (status === "completed") {
    return (
      <YStack width={26} height={26} rounded={20} bg="$good" items="center" justify="center">
        <Check size={15} color="#fff" />
      </YStack>
    );
  }
  if (status === "current") {
    return (
      <YStack width={26} height={26} rounded={20} bg="$primary" items="center" justify="center" borderWidth={3} borderColor="$primarySoft">
        <YStack width={7} height={7} rounded={10} bg="$onPrimary" />
      </YStack>
    );
  }
  return <YStack width={26} height={26} rounded={20} bg="$surface" borderWidth={2} borderColor="$border" />;
}

/** Horizontal journey stepper (scrolls on small screens). */
export function CareStepper({ steps }: { steps: CareStep[] }) {
  if (!steps.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack items="flex-start" px="$1" pt="$1">
        {steps.map((s, i) => (
          <XStack key={s.key} items="flex-start">
            <YStack items="center" width={64} gap="$1.5">
              <StepDot status={s.status} />
              <Text
                fontSize={10.5}
                fontWeight={s.status === "current" ? "700" : "500"}
                color={s.status === "pending" ? "$text3" : s.status === "current" ? "$primary" : "$color12"}
                text="center"
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </YStack>
            {i < steps.length - 1 ? (
              <YStack height={26} justify="center">
                <YStack width={22} height={2} rounded={2} bg={s.status === "completed" ? "$good" : "$border"} />
              </YStack>
            ) : null}
          </XStack>
        ))}
      </XStack>
    </ScrollView>
  );
}

const PENDING_META = [
  { key: "lab" as const, label: "lab", Icon: FlaskConical },
  { key: "radiology" as const, label: "imaging", Icon: Radiation },
  { key: "procedure" as const, label: "procedure", Icon: Stethoscope },
  { key: "medication" as const, label: "medicine", Icon: Pill },
];

/** Pending-work chips ("1 lab pending", "1 medicine to collect"). */
export function CarePending({ pending }: { pending: CareStatus["pending"] }) {
  const items = PENDING_META.filter((m) => (pending[m.key] ?? 0) > 0);
  if (!items.length) return null;
  return (
    <XStack gap="$2" flexWrap="wrap">
      {items.map((m) => (
        <XStack key={m.key} items="center" gap="$1.5" bg="$warnSoft" px="$2.5" py="$1.5" rounded={20}>
          <m.Icon size={13} color="$warn" />
          <Text fontSize={11.5} fontWeight="600" color="$warn">
            {pending[m.key]} {m.label}
            {pending[m.key] > 1 ? "s" : ""} pending
          </Text>
        </XStack>
      ))}
    </XStack>
  );
}

const WORKFLOW_LABEL: Record<string, string> = {
  opd: "Outpatient",
  ipd: "Inpatient",
  er: "Emergency",
  general: "Visit",
};

/** The full "care in progress" card. Tappable when onPress is given (Home -> detail). */
export function CareCard({ care, onPress }: { care: CareStatus; onPress?: () => void }) {
  const wf = WORKFLOW_LABEL[care.workflow ?? ""] ?? "Visit";
  const hours = care.durationHours != null ? Math.round(care.durationHours) : undefined;
  return (
    <YStack
      bg="$surface"
      borderWidth={1}
      borderColor="$primary"
      rounded={17}
      p="$4"
      gap="$3"
      shadowColor="rgba(11,78,160,0.12)"
      shadowRadius={10}
      shadowOffset={{ width: 0, height: 3 }}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.85 } : undefined}
    >
      <XStack items="center" justify="space-between" gap="$2">
        <XStack items="center" gap="$2">
          <YStack width={8} height={8} rounded={10} bg="$good" />
          <Text fontSize={12} fontWeight="700" color="$good" textTransform="uppercase" letterSpacing={0.4}>
            In hospital now
          </Text>
        </XStack>
        <XStack items="center" gap="$2">
          <Text fontSize={11.5} color="$text2">
            {wf}
            {care.department ? ` · ${care.department}` : ""}
            {hours != null ? ` · ${hours}h` : ""}
          </Text>
          {onPress ? <ChevronRight size={16} color="$text3" /> : null}
        </XStack>
      </XStack>

      {care.stage ? (
        <YStack gap="$0.5">
          <Text fontSize={17} fontWeight="800" color="$color12">
            {care.stage}
          </Text>
          {care.stageDetail ? (
            <Text fontSize={12.5} color="$text2" lineHeight={18}>
              {care.stageDetail}
            </Text>
          ) : null}
        </YStack>
      ) : null}

      <CareStepper steps={care.steps} />
      <CarePending pending={care.pending} />
    </YStack>
  );
}
