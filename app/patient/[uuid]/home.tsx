import { router, useGlobalSearchParams } from "expo-router";
import {
  Activity,
  ChevronRight,
  Droplet,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Receipt,
  Scan,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { Text, XStack, YStack } from "tamagui";
import { trpc } from "@/utils/trpc";
import { maskValue, usePrivacy } from "@/utils/privacy";
import type { LabResult } from "@/server/dto";
import {
  AlertBanner,
  CareCard,
  DLCard,
  DLNavRow,
  DLScreen,
  ErrorState,
  LineChart,
  MetricTile,
  PatientMini,
  RecentRow,
  SkeletonList,
  SummaryChips,
  dlStatus,
} from "@/components/ui";

const RECORD_LINKS = [
  { Icon: Stethoscope, title: "Visits", detail: "Appointments and admissions", seg: "visits" },
  { Icon: Pill, title: "Medicines", detail: "What you are taking now", seg: "meds" },
  { Icon: Scan, title: "Imaging", detail: "X-rays and scans", seg: "imaging" },
  { Icon: Receipt, title: "Billing", detail: "Charges and insurance", seg: "billing" },
  { Icon: FileText, title: "Documents", detail: "Summaries and reports", seg: "documents" },
];

const TILE_ICONS = [Droplet, Activity, FlaskConical, HeartPulse];

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

/** Build a date-labelled trend (oldest -> newest) for one analyte name. */
function trendFor(results: LabResult[], name: string) {
  return results
    .filter((r) => r.name === name && r.numericValue != null && r.takenAt)
    .sort((a, b) => (a.takenAt! < b.takenAt! ? -1 : 1))
    .map((r) => ({
      label: (r.takenAt ?? "").slice(5, 10),
      value: r.numericValue as number,
      color: dlStatus(r.status).color,
    }));
}

export default function Home() {
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const go = (seg: string) => router.push(`/patient/${uuid}/${seg}` as any);

  const patientQ = trpc.patient.useQuery();
  const labsQ = trpc.patientAllLabResults.useQuery();
  const careQ = trpc.patientCareStatus.useQuery();
  const allergyQ = trpc.patientAllergies.useQuery();
  const revealAll = usePrivacy((s) => s.revealAll);

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
  const normalCount = results.filter((r) => r.status === "normal").length;

  // 4 metric tiles: prefer recent numeric results (meaningful values + colored
  // status), then fall back to fill any remaining slots with other distinct tests.
  const seen = new Set<string>();
  const tiles: LabResult[] = [];
  const pickTiles = (pred: (r: LabResult) => boolean) => {
    for (const r of results) {
      if (tiles.length === 4) break;
      if (seen.has(r.name) || !pred(r)) continue;
      seen.add(r.name);
      tiles.push(r);
    }
  };
  pickTiles((r) => r.numericValue != null);
  pickTiles(() => true);

  const critical = attention[0];
  const trend = critical ? trendFor(results, critical.name) : [];
  const recent = results.slice(0, 5);

  return (
    <DLScreen>
      <YStack px="$0.5" mb="$1">
        <Text fontSize={13} color="$text2">
          {greeting()}
        </Text>
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Hello, {(patient?.name ?? "there").split(" ")[0]}
        </Text>
      </YStack>

      {allergyQ.data && allergyQ.data.length > 0 ? (
        <AlertBanner
          Icon={ShieldAlert}
          title={`Allergy alert: ${allergyQ.data.map((a) => a.substance).slice(0, 3).join(", ")}`}
          detail="Make sure your care team knows."
          onPress={() => go("passport")}
          Chevron={ChevronRight}
        />
      ) : null}

      {careQ.data?.active ? (
        <CareCard care={careQ.data} onPress={() => go("care")} />
      ) : null}

      {attention.length > 0 ? (
        <AlertBanner
          Icon={TriangleAlert}
          title={`${attention.length} result${attention.length > 1 ? "s" : ""} need a closer look`}
          detail={`Tap to review ${attention.slice(0, 2).map((r) => r.name).join(", ")}`}
          Chevron={ChevronRight}
          onPress={() => go("results")}
        />
      ) : results.length > 0 ? (
        <AlertBanner
          Icon={Activity}
          title="All results are in range"
          detail="Nothing needs your attention right now."
        />
      ) : null}

      {patient ? (
        <PatientMini
          initials={initialsOf(patient.name)}
          name={patient.name}
          sub={[revealAll ? patient.mrn : maskValue(patient.mrn, "mrn"), patient.hospital?.name]
            .filter(Boolean)
            .join(" · ")}
        />
      ) : null}

      <DLCard overflow="hidden">
        <Text fontSize={15} fontWeight="700" color="$color12" px="$3.5" pt="$3.5" pb="$1">
          Your records
        </Text>
        {RECORD_LINKS.map((l, i) => (
          <DLNavRow
            key={l.seg}
            Icon={l.Icon}
            title={l.title}
            detail={l.detail}
            onPress={() => go(l.seg)}
            border={i > 0}
          />
        ))}
      </DLCard>

      {tiles.length > 0 ? (
        <YStack gap="$2.5">
          <XStack gap="$2.5">
            {tiles.slice(0, 2).map((r, i) => {
              const m = dlStatus(r.status);
              return (
                <MetricTile
                  key={r.id}
                  Icon={TILE_ICONS[i % TILE_ICONS.length]}
                  label={r.name}
                  value={r.value}
                  unit={r.unit}
                  color={m.color}
                  soft={m.soft}
                  onPress={() => go("results")}
                />
              );
            })}
          </XStack>
          {tiles.length > 2 ? (
            <XStack gap="$2.5">
              {tiles.slice(2, 4).map((r, i) => {
                const m = dlStatus(r.status);
                return (
                  <MetricTile
                    key={r.id}
                    Icon={TILE_ICONS[(i + 2) % TILE_ICONS.length]}
                    label={r.name}
                    value={r.value}
                    unit={r.unit}
                    color={m.color}
                    soft={m.soft}
                    onPress={() => go("results")}
                  />
                );
              })}
            </XStack>
          ) : null}
        </YStack>
      ) : null}

      {results.length > 0 ? (
        <SummaryChips
          items={[
            { value: String(results.length), label: "Results" },
            { value: String(normalCount), label: "Normal", color: "$good" },
            {
              value: String(attention.length),
              label: "Attention",
              color: attention.length ? "$warn" : "$text2",
            },
          ]}
        />
      ) : null}

      {critical && trend.length > 1 ? (
        <DLCard p="$4" gap="$2">
          <XStack items="flex-start" justify="space-between">
            <YStack>
              <Text fontSize={11} fontWeight="600" color="$bad" textTransform="uppercase" letterSpacing={0.5}>
                Needs attention
              </Text>
              <Text fontSize={15} fontWeight="700" color="$color12" mt="$1">
                {critical.name} trend
              </Text>
            </YStack>
            <YStack items="flex-end">
              <Text fontSize={22} fontWeight="700" fontFamily="$mono" color={dlStatus(critical.status).color as any}>
                {critical.value}
              </Text>
              <Text fontSize={11} color="$text2">
                latest
              </Text>
            </YStack>
          </XStack>
          <LineChart points={trend} low={critical.referenceLow} high={critical.referenceHigh} height={150} />
        </DLCard>
      ) : null}

      {recent.length > 0 ? (
        <DLCard overflow="hidden">
          <XStack items="center" justify="space-between" px="$4" py="$3" borderBottomWidth={1} borderColor="$border">
            <Text fontSize={15} fontWeight="700" color="$color12">
              Recent results
            </Text>
            <XStack items="center" gap="$1" onPress={() => go("results")} pressStyle={{ opacity: 0.6 }}>
              <Text fontSize={12.5} fontWeight="600" color="$primary">
                All
              </Text>
              <ChevronRight size={15} color="$primary" />
            </XStack>
          </XStack>
          {recent.map((r, i) => (
            <RecentRow key={r.id} result={r} border={i > 0} onPress={() => go("results")} />
          ))}
        </DLCard>
      ) : null}
    </DLScreen>
  );
}
