import { Clock, Info, Pill, RefreshCw, C } from "@/components/ui/icons";
import type { ComponentType } from "react";
import { HStack, VStack, Text, useMedia } from "@/components/ui/gs";
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

function Fact({ Icon, label, value }: { Icon: ComponentType<{ size?: number; color?: string }>; label: string; value: string }) {
  return (
    <HStack className="items-start gap-[7px] flex-1 min-w-[130px]">
      <VStack className="mt-[1px]">
        <Icon size={15} color={C.text3} />
      </VStack>
      <VStack className="gap-[1px] flex-1">
        <Text className="text-[10.5px] font-plex-bold text-text3 uppercase tracking-[0.3px]">
          {label}
        </Text>
        <Text className="text-[13.5px] font-plex-semibold text-fg" numberOfLines={2}>
          {value}
        </Text>
      </VStack>
    </HStack>
  );
}

function MedicineCard({ m }: { m: Medication }) {
  const ongoing = !m.durationLabel || /indefinite/i.test(m.durationLabel);
  const durationValue = ongoing ? "Ongoing" : sentence(m.durationLabel) ?? "Ongoing";
  const hasRefills = m.refills !== undefined && m.refills > 0;

  return (
    <DLCard className="p-[17px] gap-[15px]">
      <HStack className="items-start justify-between gap-[12px]">
        <HStack className="items-start gap-[12px] flex-1 min-w-0">
          <VStack className="w-[40px] h-[40px] rounded-[11px] bg-primarySoft items-center justify-center mt-[1px]">
            <Pill size={20} color={C.primary} />
          </VStack>
          <VStack className="flex-1 gap-[1px] min-w-0">
            <Text className="text-[17px] font-plex-bold text-fg" numberOfLines={2}>
              {medicineTitle(m)}
            </Text>
            {m.form ? (
              <Text className="text-[12.5px] text-text2">
                {sentence(m.form)}
              </Text>
            ) : null}
          </VStack>
        </HStack>
        {m.active ? (
          <DLStatusPill label="Active" text="text-good" softBg="bg-goodSoft" hex={C.good} size="sm" />
        ) : (
          <DLStatusPill label="Stopped" text="text-text3" softBg="bg-surface3" hex={C.text3} size="sm" />
        )}
      </HStack>

      {/* How to take it */}
      <VStack className="bg-surface2 rounded-[12px] px-[15px] py-[12px] gap-[2px] border border-border">
        <Text className="text-[10.5px] font-plex-bold text-text3 uppercase tracking-[0.3px]">
          How to take it
        </Text>
        <Text className="text-[15px] font-plex-semibold text-fg">
          {dosingSentence(m)}
        </Text>
      </VStack>

      <HStack className="flex-wrap gap-[12px]">
        <Fact Icon={Clock} label="Duration" value={durationValue} />
        {hasRefills ? <Fact Icon={RefreshCw} label="Refills left" value={String(m.refills)} /> : null}
      </HStack>

      {m.instructions ? (
        <HStack className="items-start gap-[10px] pt-[12px] border-t border-border">
          <VStack className="mt-[1px]">
            <Info size={16} color={C.primary} />
          </VStack>
          <VStack className="gap-[1px] flex-1">
            <Text className="text-[10.5px] font-plex-bold text-text3 uppercase tracking-[0.3px]">
              Note from your doctor
            </Text>
            <Text className="text-[13.5px] text-fg leading-[20px]">
              {sentence(m.instructions)}
            </Text>
          </VStack>
        </HStack>
      ) : null}
    </DLCard>
  );
}

/** Two balanced columns on web, single stack on mobile. */
function MedGroup({ meds, wide }: { meds: Medication[]; wide: boolean }) {
  if (!wide) {
    return (
      <VStack className="gap-[12px]">
        {meds.map((m) => (
          <MedicineCard key={m.id} m={m} />
        ))}
      </VStack>
    );
  }
  const mid = Math.ceil(meds.length / 2);
  return (
    <HStack className="gap-[12px] items-start">
      {[meds.slice(0, mid), meds.slice(mid)].map((col, i) => (
        <VStack key={i} className="flex-1 gap-[12px]">
          {col.map((m) => (
            <MedicineCard key={m.id} m={m} />
          ))}
        </VStack>
      ))}
    </HStack>
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
        <VStack className="gap-[23px]">
          {active.length > 0 ? (
            <VStack className="gap-[12px]">
              <Text className="text-[14.5px] font-plex-bold text-fg px-[1px]">
                {active.length === 1 ? "1 active medicine" : `${active.length} active medicines`}
              </Text>
              <MedGroup meds={active} wide={wide} />
            </VStack>
          ) : (
            <EmptyState
              Icon={Pill}
              title="No active medicines"
              detail="You have no medicines to take right now. Stopped medicines are listed below."
            />
          )}

          {stopped.length > 0 ? (
            <VStack className="gap-[12px]">
              <Text className="text-[14.5px] font-plex-bold text-fg px-[1px]">
                Recently stopped
              </Text>
              <MedGroup meds={stopped} wide={wide} />
            </VStack>
          ) : null}
        </VStack>
      )}
    </DLScreen>
  );
}
