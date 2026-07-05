import { router, useGlobalSearchParams } from "expo-router";
import {
  ChevronRight,
  FileText,
  FlaskConical,
  Pill,
  Receipt,
  Scan,
  ShieldAlert,
  Stethoscope,
  C,
} from "@/components/ui/icons";
import type { ComponentType } from "react";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
import { trpc } from "@/utils/trpc";
import {
  AlertBanner,
  CareCard,
  DLCard,
  DLNavRow,
  DLScreen,
  ErrorState,
  RecentRow,
  SkeletonList,
} from "@/components/ui";

type IconC = ComponentType<{ size?: number; color?: string }>;

const RECORD_LINKS = [
  { Icon: Stethoscope, title: "Visits", detail: "Appointments and admissions", seg: "visits" },
  { Icon: Pill, title: "Medicines", detail: "What you are taking now", seg: "meds" },
  { Icon: Scan, title: "Imaging", detail: "X-rays and scans", seg: "imaging" },
  { Icon: FileText, title: "Reports", detail: "Radiology & procedure reports", seg: "reports" },
  { Icon: Receipt, title: "Billing", detail: "Charges and insurance", seg: "billing" },
  { Icon: FileText, title: "Documents", detail: "Summaries and reports", seg: "documents" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function initialsOf(name?: string) {
  return (
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** One tappable stat in the "At a glance" card: soft icon chip, number, label. */
function GlanceStat({
  Icon,
  value,
  label,
  tintHex = C.primary,
  tintSoftBg = "bg-primarySoft",
  onPress,
}: {
  Icon: IconC;
  value: string;
  label: string;
  tintHex?: string;
  tintSoftBg?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-[4px] py-[2px] active:opacity-60">
      <VStack className={`w-[36px] h-[36px] rounded-[11px] items-center justify-center ${tintSoftBg}`}>
        <Icon size={18} color={tintHex} />
      </VStack>
      <Text className="text-[22px] font-plex-bold font-plex-mono text-fg tracking-[-0.5px]">{value}</Text>
      <Text className="text-[11px] font-plex-semibold text-text2" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const go = (seg: string) => router.push(`/patient/${uuid}/${seg}` as any);

  const patientQ = trpc.patient.useQuery();
  const labsQ = trpc.patientAllLabResults.useQuery();
  const careQ = trpc.patientCareStatus.useQuery();
  const allergyQ = trpc.patientAllergies.useQuery();
  const medsQ = trpc.patientActiveMedications.useQuery();
  const visitsQ = trpc.patientVisits.useQuery();

  if (patientQ.isError || labsQ.isError) {
    return (
      <DLScreen>
        <ErrorState
          title="We could not load your overview"
          detail="This is usually a network hiccup. Your data is safe. Please try again."
          onRetry={() => {
            patientQ.refetch();
            labsQ.refetch();
          }}
        />
      </DLScreen>
    );
  }

  if (patientQ.isLoading || labsQ.isLoading) {
    return (
      <DLScreen>
        <SkeletonList count={4} />
      </DLScreen>
    );
  }

  const patient = patientQ.data;
  const results = (labsQ.data ?? [])
    .slice()
    .sort((a, b) => ((a.takenAt ?? "") > (b.takenAt ?? "") ? -1 : 1));

  const attention = results.filter((r) => r.status !== "normal" && r.status !== "unknown");
  const recent = results.slice(0, 4);
  const medCount = (medsQ.data ?? []).filter((m) => m.active).length;
  const visitCount = (visitsQ.data ?? []).length;

  return (
    <DLScreen>
      {/* Compact header: greeting + name on the left, tappable avatar on the right. */}
      <HStack className="items-center justify-between gap-[12px] px-[1px] py-[2px]">
        <VStack className="flex-1 min-w-0">
          <Text className="text-[13px] text-text2">{greeting()}</Text>
          <Text className="text-[24px] font-plex-bold text-fg tracking-[-0.5px]" numberOfLines={1}>
            {(patient?.name ?? "there").split(" ")[0]}
          </Text>
        </VStack>
        <Pressable
          onPress={() => go("profile")}
          className="w-[46px] h-[46px] rounded-full bg-primary items-center justify-center active:opacity-80"
        >
          <Text className="text-[16px] font-plex-bold text-onPrimary">{initialsOf(patient?.name)}</Text>
        </Pressable>
      </HStack>

      {/* Priorities first: live visit, then allergy safety. */}
      {careQ.data?.active ? <CareCard care={careQ.data} onPress={() => go("care")} /> : null}

      {allergyQ.data && allergyQ.data.length > 0 ? (
        <AlertBanner
          Icon={ShieldAlert}
          title={`Allergy: ${allergyQ.data.map((a) => a.substance).slice(0, 3).join(", ")}`}
          detail="Make sure your care team knows."
          onPress={() => go("passport")}
          Chevron={ChevronRight}
        />
      ) : null}

      {/* A whole-picture glance: medicines, visits, results — each tappable. */}
      <DLCard className="p-[17px] gap-[15px]">
        <Text className="text-[15px] font-plex-bold text-fg">At a glance</Text>
        <HStack>
          <GlanceStat Icon={Pill} value={String(medCount)} label="Medicines" onPress={() => go("meds")} />
          <VStack className="w-[1px] bg-border" />
          <GlanceStat Icon={Stethoscope} value={String(visitCount)} label="Visits" onPress={() => go("visits")} />
          <VStack className="w-[1px] bg-border" />
          <GlanceStat
            Icon={FlaskConical}
            value={String(attention.length)}
            label="To review"
            tintHex={attention.length ? C.warn : C.primary}
            tintSoftBg={attention.length ? "bg-warnSoft" : "bg-primarySoft"}
            onPress={() => go("results")}
          />
        </HStack>
        {attention.length > 0 ? (
          <Pressable
            onPress={() => go("results")}
            className="flex-row items-center gap-[7px] bg-warnSoft rounded-[11px] px-[12px] py-[10px] active:opacity-70"
          >
            <Text className="text-[12.5px] font-plex-semibold text-warn flex-1">
              {attention.length} result{attention.length > 1 ? "s" : ""} to review:{" "}
              {attention.slice(0, 2).map((r) => r.name).join(", ")}
            </Text>
            <ChevronRight size={15} color={C.warn} />
          </Pressable>
        ) : null}
      </DLCard>

      {/* Recent results — a short, scannable list. */}
      {recent.length > 0 ? (
        <DLCard className="overflow-hidden">
          <HStack className="items-center justify-between px-[17px] py-[12px] border-b border-border">
            <Text className="text-[15px] font-plex-bold text-fg">Recent results</Text>
            <Pressable onPress={() => go("results")} className="flex-row items-center gap-[2px] active:opacity-60">
              <Text className="text-[12.5px] font-plex-semibold text-primary">All</Text>
              <ChevronRight size={15} color={C.primary} />
            </Pressable>
          </HStack>
          {recent.map((r, i) => (
            <RecentRow key={r.id} result={r} border={i > 0} onPress={() => go("results")} />
          ))}
        </DLCard>
      ) : null}

      {/* Records navigation. */}
      <DLCard className="overflow-hidden">
        <Text className="text-[15px] font-plex-bold text-fg px-[15px] pt-[15px] pb-[2px]">Your records</Text>
        {RECORD_LINKS.map((l, i) => (
          <DLNavRow key={l.seg} Icon={l.Icon} title={l.title} detail={l.detail} onPress={() => go(l.seg)} border={i > 0} />
        ))}
      </DLCard>
    </DLScreen>
  );
}
