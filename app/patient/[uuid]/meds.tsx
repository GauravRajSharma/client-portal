import { Clock, Info, Pill, RefreshCw } from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Text, XStack, YStack, useMedia } from "tamagui";
import {
  DLCard,
  DLScreen,
  DLStatusPill,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import type { Medication } from "@/server/dto";
import { trpc } from "@/utils/trpc";

function medicineTitle(m: Medication) {
  return [m.name, m.strength].filter(Boolean).join(" ");
}

function sentence(s?: string) {
  if (!s) return undefined;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Clinical codes -> plain patient language. Falls back to the raw value.
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
const humanRoute = (r?: string) => (r ? (ROUTE_WORDS[r.trim().toLowerCase()] ?? r) : undefined);
const humanFrequency = (f?: string) => (f ? (FREQUENCY_WORDS[f.trim().toLowerCase()] ?? f) : undefined);

/** "Take 1 tablet by mouth, twice a day." Never invents a missing instruction. */
function dosingSentence(m: Medication): string {
  const amount = [m.dose, m.doseUnit].filter(Boolean).join(" ");
  const route = humanRoute(m.route);
  const freq = humanFrequency(m.frequency);
  if (!amount && !route && !freq) return "Take as directed by your doctor.";
  const parts = ["Take"];
  if (amount) parts.push(amount);
  if (route) parts.push(route);
  let line = parts.join(" ");
  if (freq) line += `, ${freq}`;
  return `${line}.`;
}

function Fact({ Icon, label, value }: { Icon: NamedExoticComponent<any>; label: string; value: string }) {
  return (
    <XStack items="flex-start" gap="$2" flex={1} minW={130}>
      <YStack mt="$0.5">
        <Icon size={15} color="$text3" />
      </YStack>
      <YStack gap="$0.5" flex={1}>
        <Text fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase" letterSpacing={0.3}>
          {label}
        </Text>
        <Text fontSize={13.5} fontWeight="600" color="$color12" numberOfLines={2}>
          {value}
        </Text>
      </YStack>
    </XStack>
  );
}

function MedicineCard({ m }: { m: Medication }) {
  const ongoing = !m.durationLabel || /indefinite/i.test(m.durationLabel);
  const durationValue = ongoing ? "Ongoing" : sentence(m.durationLabel) ?? "Ongoing";
  const hasRefills = m.refills !== undefined && m.refills > 0;

  return (
    <DLCard p="$4" gap="$3.5">
      <XStack items="flex-start" justify="space-between" gap="$3">
        <XStack items="flex-start" gap="$3" flex={1} minW={0}>
          <YStack width={40} height={40} rounded={11} bg="$primarySoft" items="center" justify="center" mt="$0.5">
            <Pill size={20} color="$primary" />
          </YStack>
          <YStack flex={1} gap="$0.5" minW={0}>
            <Text fontSize={17} fontWeight="800" color="$color12" numberOfLines={2}>
              {medicineTitle(m)}
            </Text>
            {m.form ? (
              <Text fontSize={12.5} color="$text2">
                {sentence(m.form)}
              </Text>
            ) : null}
          </YStack>
        </XStack>
        {m.active ? (
          <DLStatusPill label="Active" color="$good" soft="$goodSoft" size="sm" />
        ) : (
          <DLStatusPill label="Stopped" color="$text3" soft="$surface3" size="sm" />
        )}
      </XStack>

      {/* How to take it */}
      <YStack bg="$surface2" rounded={12} px="$3.5" py="$3" gap="$1" borderWidth={1} borderColor="$border">
        <Text fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase" letterSpacing={0.3}>
          How to take it
        </Text>
        <Text fontSize={15} fontWeight="600" color="$color12">
          {dosingSentence(m)}
        </Text>
      </YStack>

      <XStack flexWrap="wrap" rowGap="$3" columnGap="$3">
        <Fact Icon={Clock} label="Duration" value={durationValue} />
        {hasRefills ? <Fact Icon={RefreshCw} label="Refills left" value={String(m.refills)} /> : null}
      </XStack>

      {m.instructions ? (
        <XStack items="flex-start" gap="$2.5" pt="$3" borderTopWidth={1} borderColor="$border">
          <YStack mt="$0.5">
            <Info size={16} color="$primary" />
          </YStack>
          <YStack gap="$0.5" flex={1}>
            <Text fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase" letterSpacing={0.3}>
              Note from your doctor
            </Text>
            <Text fontSize={13.5} color="$color12" lineHeight={20}>
              {sentence(m.instructions)}
            </Text>
          </YStack>
        </XStack>
      ) : null}
    </DLCard>
  );
}

/** Two balanced columns on web, single stack on mobile. */
function MedGroup({ meds, wide }: { meds: Medication[]; wide: boolean }) {
  if (!wide) {
    return (
      <YStack gap="$3">
        {meds.map((m) => (
          <MedicineCard key={m.id} m={m} />
        ))}
      </YStack>
    );
  }
  const mid = Math.ceil(meds.length / 2);
  return (
    <XStack gap="$3" items="flex-start">
      {[meds.slice(0, mid), meds.slice(mid)].map((col, i) => (
        <YStack key={i} flex={1} gap="$3">
          {col.map((m) => (
            <MedicineCard key={m.id} m={m} />
          ))}
        </YStack>
      ))}
    </XStack>
  );
}

export default function Meds() {
  const media = useMedia();
  const wide = Boolean(media.md);
  const { data, isLoading, isError, refetch } = trpc.patientActiveMedications.useQuery();

  const meds = data ?? [];
  const active = meds.filter((m) => m.active).sort((a, b) => a.name.localeCompare(b.name));
  const stopped = meds.filter((m) => !m.active).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DLScreen>
      <DLTitle title="Medicines" subtitle="What you are taking now and how to take it." />

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
          detail="When your doctor prescribes medicine, it appears here with clear instructions on how to take it."
        />
      ) : (
        <YStack gap="$5">
          {active.length > 0 ? (
            <YStack gap="$3">
              <Text fontSize={14.5} fontWeight="700" color="$color12" px="$0.5">
                {active.length === 1 ? "1 active medicine" : `${active.length} active medicines`}
              </Text>
              <MedGroup meds={active} wide={wide} />
            </YStack>
          ) : (
            <EmptyState
              Icon={Pill}
              title="No active medicines"
              detail="You have no medicines to take right now. Stopped medicines are listed below."
            />
          )}

          {stopped.length > 0 ? (
            <YStack gap="$3">
              <Text fontSize={14.5} fontWeight="700" color="$color12" px="$0.5">
                Recently stopped
              </Text>
              <MedGroup meds={stopped} wide={wide} />
            </YStack>
          ) : null}
        </YStack>
      )}
    </DLScreen>
  );
}
