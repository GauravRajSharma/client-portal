import { Check, Clock, Info, Pill, RefreshCw } from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Separator, Text, XStack, YStack, useMedia } from "tamagui";
import {
  EmptyState,
  ErrorState,
  Panel,
  Screen,
  Section,
  SkeletonList,
  StatusPill,
} from "@/components/ui";
import type { Medication } from "@/server/dto";
import { trpc } from "@/utils/trpc";

/**
 * Compose the human-readable medicine title: "Name 500 mg" with the form below.
 * Strength is part of identity (a patient recognises the box by it), so it sits
 * with the name rather than buried in the dosing line.
 */
function medicineTitle(m: Medication): string {
  return [m.name, m.strength].filter(Boolean).join(" ");
}

/** Capitalise the first letter only; keep the rest as the backend cleaned it. */
function sentence(s?: string): string | undefined {
  if (!s) return undefined;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Common clinical route codes -> plain patient language. Falls back to the raw value. */
const ROUTE_WORDS: Record<string, string> = {
  oral: "by mouth",
  "by mouth": "by mouth",
  po: "by mouth",
  iv: "into a vein",
  intravenous: "into a vein",
  im: "as an injection",
  intramuscular: "as an injection",
  sc: "under the skin",
  subcutaneous: "under the skin",
  topical: "on the skin",
  inhaled: "by inhaler",
  rectal: "rectally",
  ophthalmic: "into the eye",
  nasal: "into the nose",
};

/** Common frequency abbreviations -> plain language, so we never show "bid" etc. */
const FREQUENCY_WORDS: Record<string, string> = {
  od: "once a day",
  "q.d.": "once a day",
  qd: "once a day",
  bid: "twice a day",
  "b.i.d.": "twice a day",
  tid: "three times a day",
  "t.i.d.": "three times a day",
  qid: "four times a day",
  "q.i.d.": "four times a day",
  hs: "at bedtime",
  prn: "only when needed",
  stat: "right away",
};

function humanRoute(route?: string): string | undefined {
  if (!route) return undefined;
  return ROUTE_WORDS[route.trim().toLowerCase()] ?? route;
}

function humanFrequency(freq?: string): string | undefined {
  if (!freq) return undefined;
  return FREQUENCY_WORDS[freq.trim().toLowerCase()] ?? freq;
}

/** A single "how to take it" fact: icon, quiet label, plain-language value. */
function DoseFact({
  Icon,
  label,
  value,
}: {
  Icon: NamedExoticComponent<any>;
  label: string;
  value: string;
}) {
  return (
    <XStack items="flex-start" gap="$2.5" flex={1} minW={150}>
      <YStack pt="$0.5">
        <Icon size={16} color="$color9" />
      </YStack>
      <YStack gap="$0.5" flex={1}>
        <Text fontSize="$1" fontWeight="700" color="$color9" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="$4" fontWeight="600" color="$color12" numberOfLines={2}>
          {value}
        </Text>
      </YStack>
    </XStack>
  );
}

/**
 * The dosing line a patient actually reads: "Take 1 tablet by mouth, twice a day".
 * Built defensively so a missing field never produces a dangling phrase. When we
 * have nothing concrete, we never invent an instruction.
 */
function dosingSentence(m: Medication): string {
  const amount = [m.dose, m.doseUnit].filter(Boolean).join(" ");
  const route = humanRoute(m.route);
  const freq = humanFrequency(m.frequency);
  if (!amount && !route && !freq) {
    return "Take as directed by your doctor.";
  }
  const parts: string[] = ["Take"];
  if (amount) parts.push(amount);
  if (route) parts.push(route);
  let line = parts.join(" ");
  if (freq) line += `, ${freq}`;
  return `${line}.`;
}

function MedicineCard({ medicine }: { medicine: Medication }) {
  const ongoing =
    !medicine.durationLabel ||
    medicine.durationLabel === "indefinite" ||
    /indefinite/i.test(medicine.durationLabel);
  const durationValue = ongoing ? "Ongoing" : sentence(medicine.durationLabel) ?? "Ongoing";
  const hasRefills = medicine.refills !== undefined && medicine.refills > 0;

  return (
    <Panel gap="$3.5">
      {/* Identity: name + strength prominent, form + active status secondary */}
      <XStack items="flex-start" justify="space-between" gap="$3">
        <XStack items="flex-start" gap="$2.5" flex={1}>
          <YStack p="$2" rounded="$4" bg="$color3" mt="$0.5">
            <Pill size={20} color="$color11" />
          </YStack>
          <YStack gap="$1" flex={1}>
            <Text fontSize="$7" fontWeight="800" color="$color12" numberOfLines={2}>
              {medicineTitle(medicine)}
            </Text>
            {medicine.form ? (
              <Text fontSize="$3" color="$color10">
                {sentence(medicine.form)}
              </Text>
            ) : null}
          </YStack>
        </XStack>
        {medicine.active ? (
          <StatusPill label="Active" theme="success" Icon={Check} size="sm" />
        ) : (
          <StatusPill label="Stopped" theme="neutral" size="sm" />
        )}
      </XStack>

      {/* The reassuring, scannable "how to take it" line */}
      <YStack
        bg="$color2"
        rounded="$5"
        px="$3.5"
        py="$3"
        gap="$1"
        borderColor="$borderColor"
        borderWidth={1}
      >
        <Text fontSize="$1" fontWeight="700" color="$color9" textTransform="uppercase">
          How to take it
        </Text>
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {dosingSentence(medicine)}
        </Text>
      </YStack>

      {/*
        Supporting facts that the dosing sentence does NOT already carry, so the
        card never repeats itself. Duration and refills only.
      */}
      <XStack flexWrap="wrap" rowGap="$3" columnGap="$4">
        <DoseFact Icon={Clock} label="Duration" value={durationValue} />
        {hasRefills ? (
          <DoseFact
            Icon={RefreshCw}
            label="Refills left"
            value={String(medicine.refills)}
          />
        ) : null}
      </XStack>

      {medicine.instructions ? (
        <>
          <Separator borderColor="$borderColor" />
          <XStack items="flex-start" gap="$2.5">
            <YStack pt="$0.5">
              <Info size={16} color="$accent9" />
            </YStack>
            <YStack gap="$0.5" flex={1}>
              <Text fontSize="$1" fontWeight="700" color="$color9" textTransform="uppercase">
                Note from your doctor
              </Text>
              <Text fontSize="$4" color="$color12" lineHeight="$5">
                {sentence(medicine.instructions)}
              </Text>
            </YStack>
          </XStack>
        </>
      ) : null}
    </Panel>
  );
}

/**
 * Lay out a group of medicines. On wide screens we split into two balanced columns
 * (premium, avoids the banned identical-card grid) but keep the group's own order
 * within each column. Mobile is a single stacked list.
 */
function MedicineGroup({ medicines, wide }: { medicines: Medication[]; wide: boolean }) {
  if (!wide) {
    return (
      <YStack gap="$3.5">
        {medicines.map((m) => (
          <MedicineCard key={m.id} medicine={m} />
        ))}
      </YStack>
    );
  }
  const mid = Math.ceil(medicines.length / 2);
  const cols = [medicines.slice(0, mid), medicines.slice(mid)];
  return (
    <XStack gap="$3.5" items="flex-start">
      {cols.map((col, i) => (
        <YStack key={i} flex={1} gap="$3.5">
          {col.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </YStack>
      ))}
    </XStack>
  );
}

export default function Meds() {
  const media = useMedia();
  const { data, isLoading, isError, refetch } =
    trpc.patientActiveMedications.useQuery();

  const meds = data ?? [];
  // Answer the patient's real question first: what am I taking now?
  const active = meds
    .filter((m) => m.active)
    .sort((a, b) => a.name.localeCompare(b.name));
  const stopped = meds
    .filter((m) => !m.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Screen maxWidth={980}>
      <YStack gap="$1">
        <Text fontSize="$9" fontWeight="800" color="$color12">
          Medicines
        </Text>
        <Text fontSize="$4" color="$color10">
          What you are currently taking and how to take it.
        </Text>
      </YStack>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your medicines"
          detail="We couldn't reach your records right now. Please try again."
          onRetry={() => refetch()}
        />
      ) : active.length === 0 && stopped.length === 0 ? (
        <EmptyState
          Icon={Pill}
          title="No active medicines"
          detail="When your doctor prescribes medicine, it will show here with clear instructions on how to take it."
        />
      ) : (
        <YStack gap="$5">
          {active.length > 0 ? (
            <Section
              title={
                active.length === 1
                  ? "1 active medicine"
                  : `${active.length} active medicines`
              }
            >
              <MedicineGroup medicines={active} wide={media.md} />
            </Section>
          ) : (
            <EmptyState
              Icon={Pill}
              title="No active medicines"
              detail="You have no medicines to take right now. Stopped medicines are listed below."
            />
          )}

          {stopped.length > 0 ? (
            <Section title="Recently stopped">
              <MedicineGroup medicines={stopped} wide={media.md} />
            </Section>
          ) : null}
        </YStack>
      )}
    </Screen>
  );
}
