import { router, useGlobalSearchParams } from "expo-router";
import {
  ChevronRight,
  FileText,
  Pill,
  Receipt,
  Scan,
  ShieldAlert,
  Stethoscope,
} from "@tamagui/lucide-icons";
import { Text, XStack, YStack } from "tamagui";
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

/** One stat column in the results summary card. */
function Stat({ value, label, color }: { value: string; label: string; color: any }) {
  return (
    <YStack flex={1} items="center" gap="$1">
      <Text fontSize={26} fontWeight="700" fontFamily="$mono" color={color} letterSpacing={-0.5}>
        {value}
      </Text>
      <Text fontSize={11.5} fontWeight="600" color="$text2">
        {label}
      </Text>
    </YStack>
  );
}

export default function Home() {
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const go = (seg: string) => router.push(`/patient/${uuid}/${seg}` as any);

  const patientQ = trpc.patient.useQuery();
  const labsQ = trpc.patientAllLabResults.useQuery();
  const careQ = trpc.patientCareStatus.useQuery();
  const allergyQ = trpc.patientAllergies.useQuery();

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
  const recent = results.slice(0, 4);

  return (
    <DLScreen>
      {/* Compact header: greeting + name on the left, tappable avatar on the right. */}
      <XStack items="center" justify="space-between" gap="$3" px="$0.5" py="$1">
        <YStack flex={1} minW={0}>
          <Text fontSize={13} color="$text2">
            {greeting()}
          </Text>
          <Text fontSize={24} fontWeight="800" color="$color12" letterSpacing={-0.5} numberOfLines={1}>
            {(patient?.name ?? "there").split(" ")[0]}
          </Text>
        </YStack>
        <YStack
          width={46}
          height={46}
          rounded={23}
          bg="$primary"
          items="center"
          justify="center"
          onPress={() => go("profile")}
          pressStyle={{ opacity: 0.8 }}
        >
          <Text fontSize={16} fontWeight="700" color="$onPrimary">
            {initialsOf(patient?.name)}
          </Text>
        </YStack>
      </XStack>

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

      {/* One calm results summary — replaces the old banners, chips, and metric tiles. */}
      {results.length > 0 ? (
        <DLCard p="$4" gap="$3.5" onPress={() => go("results")} pressStyle={{ opacity: 0.85 }}>
          <XStack items="center" justify="space-between">
            <Text fontSize={15} fontWeight="700" color="$color12">
              Your results
            </Text>
            <ChevronRight size={18} color="$text3" />
          </XStack>
          <XStack>
            <Stat value={String(results.length)} label="Total" color="$color12" />
            <YStack width={1} bg="$border" />
            <Stat value={String(normalCount)} label="In range" color="$good" />
            <YStack width={1} bg="$border" />
            <Stat
              value={String(attention.length)}
              label="Needs review"
              color={attention.length ? "$warn" : "$text3"}
            />
          </XStack>
          {attention.length > 0 ? (
            <XStack
              items="center"
              gap="$2"
              bg="$warnSoft"
              rounded={11}
              px="$3"
              py="$2.5"
            >
              <Text fontSize={12.5} fontWeight="600" color="$warn" flex={1}>
                {attention.length} result{attention.length > 1 ? "s" : ""} to review:{" "}
                {attention.slice(0, 2).map((r) => r.name).join(", ")}
              </Text>
              <ChevronRight size={15} color="$warn" />
            </XStack>
          ) : null}
        </DLCard>
      ) : null}

      {/* Recent results — a short, scannable list. */}
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

      {/* Records navigation. */}
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
    </DLScreen>
  );
}
