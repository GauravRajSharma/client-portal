/**
 * "Care in progress" panel — a read-only, ride-share-style live view of where the
 * patient is in their current hospital visit. Driven by CareStatus (see server/dto).
 */
import {
  BedDouble,
  Check,
  ChevronRight,
  FlaskConical,
  Pill,
  Radiation,
  Stethoscope,
  C,
} from "@/components/ui/icons";
import type { ComponentType } from "react";
import { HStack, VStack, Text, Pressable, ScrollView, shadowSoft } from "./gs";
import type { CareStatus, CareStep } from "@/server/dto";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");
type IconC = ComponentType<{ size?: number; color?: string }>;

function StepDot({ status }: { status: CareStep["status"] }) {
  if (status === "completed") {
    return (
      <VStack className="w-[26px] h-[26px] rounded-full bg-good items-center justify-center">
        <Check size={15} color="#fff" />
      </VStack>
    );
  }
  if (status === "current") {
    return (
      <VStack className="w-[26px] h-[26px] rounded-full bg-primary items-center justify-center border-[3px] border-primarySoft">
        <VStack className="w-[7px] h-[7px] rounded-full bg-onPrimary" />
      </VStack>
    );
  }
  return <VStack className="w-[26px] h-[26px] rounded-full bg-surface border-2 border-border" />;
}

/** Horizontal journey stepper (scrolls on small screens). */
export function CareStepper({ steps }: { steps: CareStep[] }) {
  if (!steps.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <HStack className="items-start px-[2px] pt-[2px]">
        {steps.map((s, i) => (
          <HStack key={s.key} className="items-start">
            <VStack className="items-center w-[64px] gap-[4px]">
              <StepDot status={s.status} />
              <Text
                className={cx(
                  "text-[10.5px] text-center",
                  s.status === "current" ? "font-plex-bold text-primary" : s.status === "pending" ? "font-plex-medium text-text3" : "font-plex-medium text-fg",
                )}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </VStack>
            {i < steps.length - 1 ? (
              <VStack className="h-[26px] justify-center">
                <VStack className={cx("w-[22px] h-[2px] rounded-[2px]", s.status === "completed" ? "bg-good" : "bg-border")} />
              </VStack>
            ) : null}
          </HStack>
        ))}
      </HStack>
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
    <HStack className="gap-[7px] flex-wrap">
      {items.map((m) => (
        <HStack key={m.key} className="items-center gap-[4px] bg-warnSoft px-[10px] py-[4px] rounded-[20px]">
          <m.Icon size={13} color={C.warn} />
          <Text className="text-[11.5px] font-plex-semibold text-warn">
            {pending[m.key]} {m.label}
            {pending[m.key] > 1 ? "s" : ""} pending
          </Text>
        </HStack>
      ))}
    </HStack>
  );
}

function LiveChip({ Icon, label }: { Icon: IconC; label: string }) {
  return (
    <HStack className="items-center gap-[4px] bg-primarySoft px-[10px] py-[4px] rounded-[20px]">
      <Icon size={13} color={C.primary} />
      <Text className="text-[11.5px] font-plex-semibold text-primary">{label}</Text>
    </HStack>
  );
}

/** Admitted / ward chip from the patient-scoped inpatient-admissions view. */
export function CareLive({ live }: { live: NonNullable<CareStatus["live"]> }) {
  if (!live.isWard) return null;
  return (
    <HStack className="gap-[7px] flex-wrap">
      <LiveChip Icon={BedDouble} label={live.ward ? `Admitted · ${live.ward}` : "Admitted to ward"} />
    </HStack>
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
    <Pressable
      onPress={onPress}
      className={cx("bg-surface border border-primary rounded-[17px] p-[17px] gap-[12px]", onPress && "active:opacity-[0.85]")}
      style={{ ...shadowSoft, shadowColor: "rgba(11,78,160,0.12)", shadowRadius: 10 }}
    >
      <HStack className="items-center justify-between gap-[7px]">
        <HStack className="items-center gap-[7px]">
          <VStack className="w-[8px] h-[8px] rounded-full bg-good" />
          <Text className="text-[12px] font-plex-bold text-good uppercase tracking-[0.4px]">In hospital now</Text>
        </HStack>
        <HStack className="items-center gap-[7px]">
          <Text className="text-[11.5px] text-text2">
            {wf}
            {care.department ? ` · ${care.department}` : ""}
            {hours != null ? ` · ${hours}h` : ""}
          </Text>
          {onPress ? <ChevronRight size={16} color={C.text3} /> : null}
        </HStack>
      </HStack>

      {care.stage ? (
        <VStack className="gap-[1px]">
          <Text className="text-[17px] font-plex-bold text-fg">{care.stage}</Text>
          {care.stageDetail ? <Text className="text-[12.5px] text-text2 leading-[18px]">{care.stageDetail}</Text> : null}
        </VStack>
      ) : null}

      {care.live ? <CareLive live={care.live} /> : null}
      <CareStepper steps={care.steps} />
      <CarePending pending={care.pending} />
    </Pressable>
  );
}
