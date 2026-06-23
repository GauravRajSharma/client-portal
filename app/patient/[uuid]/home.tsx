import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  HeartPulse,
  Pill,
  Stethoscope,
  User,
} from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Theme, XStack, YStack, useMedia } from "tamagui";
import {
  DateText,
  EmptyState,
  ErrorState,
  IdentityChip,
  Panel,
  Screen,
  Section,
  Skeleton,
  StatusPill,
  labStatusMeta,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";
import type { LabResult, PatientOverview, Visit } from "@/server/dto";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(name?: string) {
  const n = (name ?? "").trim().split(/\s+/)[0];
  return n || "there";
}

/** Header band: a warm greeting and who-am-I, so the patient knows the record is theirs. */
function HomeHeader({
  name,
  mrn,
  hospital,
}: {
  name?: string;
  mrn?: string;
  hospital?: string;
}) {
  return (
    <YStack gap="$3">
      <YStack gap="$1">
        <Text fontSize="$3" color="$color10" fontWeight="600">
          {greeting()},
        </Text>
        <Text fontSize="$9" fontWeight="800" color="$color12" numberOfLines={1}>
          {firstName(name)}
        </Text>
      </YStack>
      <IdentityChip
        patient={{
          name: name ?? "",
          mrn: mrn ?? "",
          hospital: hospital ? { code: "", name: hospital } : undefined,
        }}
      />
    </YStack>
  );
}

/** A compact lab line for the attention list: status and plain words first, value second. */
function AttentionRow({ result }: { result: LabResult }) {
  const meta = labStatusMeta(result.status);
  return (
    <XStack items="center" justify="space-between" gap="$3" py="$2">
      <YStack flex={1} gap="$1">
        <Text fontSize="$4" fontWeight="600" color="$color12" numberOfLines={1}>
          {result.name}
        </Text>
        <XStack items="baseline" gap="$1">
          <Text
            fontSize="$5"
            fontWeight="800"
            color="$color12"
            fontVariant={["tabular-nums"]}
          >
            {result.value}
          </Text>
          {result.unit ? (
            <Text fontSize="$2" color="$color9">
              {result.unit}
            </Text>
          ) : null}
        </XStack>
      </YStack>
      <StatusPill label={meta.label} theme={meta.theme} Icon={meta.Icon} size="sm" />
    </XStack>
  );
}

/** Results block: lead with reassurance when in range; surface what needs a look otherwise. */
function ResultsBlock({
  labs,
  onOpen,
}: {
  labs: PatientOverview["labs"];
  onOpen: () => void;
}) {
  // New patient with no results on record: stay quiet, the empty state covers this elsewhere.
  if (labs.total === 0) return null;

  if (labs.attentionCount === 0) {
    return (
      <Theme name="success">
        <Panel borderColor="$color6" bg="$color2">
          <XStack items="center" gap="$3">
            <YStack p="$2.5" rounded="$10" bg="$color4">
              <CheckCircle2 size={22} color="$color11" />
            </YStack>
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="700" color="$color12">
                All results in range
              </Text>
              <Text fontSize="$3" color="$color11">
                Nothing in your {labs.total} recorded result
                {labs.total === 1 ? "" : "s"} needs your attention right now.
              </Text>
            </YStack>
          </XStack>
        </Panel>
      </Theme>
    );
  }

  const extra = labs.attentionCount - labs.attention.length;
  return (
    <Theme name="warning">
      <Panel borderColor="$color6">
        <XStack items="center" justify="space-between" gap="$3">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Worth a look
          </Text>
          <StatusPill
            label={`${labs.attentionCount} out of range`}
            theme="warning"
            size="sm"
          />
        </XStack>
        <Text fontSize="$3" color="$color11" mt="$-1">
          These results are outside the usual range. They are not always a problem, but
          they are worth discussing with your doctor.
        </Text>
        <YStack>
          {labs.attention.map((r, i) => (
            <YStack key={r.id}>
              {i > 0 ? <YStack height={1} bg="$color5" /> : null}
              <AttentionRow result={r} />
            </YStack>
          ))}
        </YStack>
        <XStack
          items="center"
          gap="$1.5"
          minH={44}
          py="$2"
          onPress={onOpen}
          pressStyle={{ opacity: 0.6 }}
          cursor="pointer"
        >
          <Text fontSize="$3" fontWeight="700" color="$color12">
            {extra > 0 ? `See all results (${extra} more)` : "See all results"}
          </Text>
          <ArrowUpRight size={16} color="$color12" />
        </XStack>
      </Panel>
    </Theme>
  );
}

/** Latest visit: the human facts of the last time they were seen. */
function LatestVisitBlock({ visit, onOpen }: { visit?: Visit; onOpen: () => void }) {
  if (!visit) {
    return (
      <Panel>
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Your latest visit
        </Text>
        <Text fontSize="$3" color="$color10">
          We do not have a visit on record yet. It will appear here after your next one.
        </Text>
      </Panel>
    );
  }
  const doctor = visit.doctor?.name
    ? [visit.doctor.name, visit.doctor.title].filter(Boolean).join(", ")
    : undefined;
  return (
    <Panel
      onPress={onOpen}
      pressStyle={{ opacity: 0.85 }}
      hoverStyle={{ borderColor: "$color7" }}
      cursor="pointer"
      animation="quick"
    >
      <XStack items="center" justify="space-between" gap="$3">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Your latest visit
        </Text>
        <ChevronRight size={18} color="$color9" />
      </XStack>
      <XStack items="center" gap="$2.5">
        <YStack p="$2" rounded="$6" bg="$color3">
          <Stethoscope size={18} color="$color11" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            {visit.typeLabel}
          </Text>
          <DateText value={visit.date} />
        </YStack>
        <StatusPill
          label={visit.status === "open" ? "Open" : "Closed"}
          theme={visit.status === "open" ? "accent" : "neutral"}
          size="sm"
        />
      </XStack>
      <YStack gap="$1.5" pt="$1">
        {visit.department ? (
          <DetailLine label="Department" value={visit.department} />
        ) : null}
        {doctor ? <DetailLine label="Seen by" value={doctor} /> : null}
      </YStack>
    </Panel>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <XStack gap="$2" items="baseline">
      <Text fontSize="$2" color="$color9" width={92}>
        {label}
      </Text>
      <Text fontSize="$3" color="$color11" flex={1} numberOfLines={2}>
        {value}
      </Text>
    </XStack>
  );
}

/** Active medicines: a count to anchor, a couple of names to recognise. */
function MedicinesBlock({
  medications,
  onOpen,
}: {
  medications: PatientOverview["medications"];
  onOpen: () => void;
}) {
  const { activeCount, sampleNames } = medications;
  // Quieter, flatter treatment than the visit panel so the two blocks never read as a
  // mirrored pair (DESIGN.md bans identical-card grids). A tinted surface, list-like.
  return (
    <YStack
      bg="$color2"
      rounded="$6"
      p="$4"
      gap="$3"
      onPress={onOpen}
      pressStyle={{ opacity: 0.85 }}
      hoverStyle={{ bg: "$color3" }}
      cursor="pointer"
      animation="quick"
    >
      <XStack items="center" gap="$2">
        <Pill size={16} color="$color10" />
        <Text fontSize="$3" fontWeight="700" color="$color10" letterSpacing={0.4}>
          ACTIVE MEDICINES
        </Text>
      </XStack>
      {activeCount === 0 ? (
        <Text fontSize="$3" color="$color10">
          You have no active medicines on record right now.
        </Text>
      ) : (
        <YStack gap="$1.5">
          <XStack items="baseline" gap="$2">
            <Text
              fontSize="$8"
              fontWeight="800"
              color="$color12"
              fontVariant={["tabular-nums"]}
            >
              {activeCount}
            </Text>
            <Text fontSize="$3" color="$color10">
              you are taking now
            </Text>
          </XStack>
          {sampleNames.length ? (
            <Text fontSize="$3" color="$color11" numberOfLines={2}>
              {sampleNames.join(", ")}
              {activeCount > sampleNames.length ? ", and more" : ""}
            </Text>
          ) : null}
        </YStack>
      )}
      <XStack items="center" gap="$1.5" minH={32}>
        <Text fontSize="$3" fontWeight="700" color="$color11">
          View all medicines
        </Text>
        <ChevronRight size={16} color="$color10" />
      </XStack>
    </YStack>
  );
}

interface QuickLink {
  key: string;
  label: string;
  Icon: NamedExoticComponent<any>;
}

const QUICK_LINKS: QuickLink[] = [
  { key: "visits", label: "Visits", Icon: Stethoscope },
  { key: "results", label: "Results", Icon: FlaskConical },
  { key: "meds", label: "Medicines", Icon: Pill },
  { key: "profile", label: "Profile", Icon: User },
];

function QuickLinks({ onGo }: { onGo: (key: string) => void }) {
  return (
    <XStack flexWrap="wrap" gap="$3">
      {QUICK_LINKS.map((l) => (
        <YStack
          key={l.key}
          flex={1}
          minW={140}
          minH={84}
          bg="$color1"
          borderColor="$borderColor"
          borderWidth={1}
          rounded="$6"
          p="$3"
          gap="$2"
          justify="center"
          onPress={() => onGo(l.key)}
          pressStyle={{ opacity: 0.7, bg: "$color2" }}
          hoverStyle={{ borderColor: "$color7" }}
          animation="quick"
          cursor="pointer"
        >
          <l.Icon size={20} color="$accent9" />
          <Text fontSize="$4" fontWeight="700" color="$color12">
            {l.label}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}

function HomeSkeleton() {
  return (
    <Screen>
      <YStack gap="$3">
        <Skeleton width="40%" height={14} />
        <Skeleton width="60%" height={28} />
        <XStack items="center" gap="$2.5" pt="$1">
          <Skeleton width={44} height={44} rounded="$10" />
          <YStack gap="$2" flex={1}>
            <Skeleton width="55%" />
            <Skeleton width="40%" height={12} />
          </YStack>
        </XStack>
      </YStack>
      <Panel gap="$2.5">
        <Skeleton width="35%" />
        <Skeleton width="90%" height={12} />
        <Skeleton width="70%" height={12} />
      </Panel>
      <XStack gap="$3" flexWrap="wrap">
        <Panel flex={1} minW={260} gap="$2.5">
          <Skeleton width="45%" />
          <Skeleton width="80%" height={12} />
        </Panel>
        <Panel flex={1} minW={260} gap="$2.5">
          <Skeleton width="45%" />
          <Skeleton width="80%" height={12} />
        </Panel>
      </XStack>
    </Screen>
  );
}

export default function Home() {
  const media = useMedia();
  const { uuid } = useLocalSearchParams<{ uuid: string }>();

  const patientQ = trpc.patient.useQuery();
  const overviewQ = trpc.patientOverview.useQuery();

  const go = (key: string) => router.push(`/patient/${uuid}/${key}` as any);

  if (patientQ.isLoading || overviewQ.isLoading) return <HomeSkeleton />;

  if (overviewQ.isError || patientQ.isError) {
    return (
      <Screen>
        <ErrorState
          title="We could not load your overview"
          detail="This is usually a network hiccup. Your data is safe. Please try again."
          onRetry={() => {
            patientQ.refetch();
            overviewQ.refetch();
          }}
        />
      </Screen>
    );
  }

  const patient = patientQ.data;
  const overview = overviewQ.data;

  const nothingYet =
    !overview?.latestVisit &&
    (overview?.labs.total ?? 0) === 0 &&
    (overview?.medications.activeCount ?? 0) === 0;

  if (nothingYet) {
    return (
      <Screen>
        <HomeHeader name={patient?.name} mrn={patient?.ref} />
        <EmptyState
          Icon={HeartPulse}
          title="Your health record is ready"
          detail="There is nothing to show yet. After your next visit, your results, medicines and visit history will appear here."
        />
      </Screen>
    );
  }

  const secondary = (
    <>
      <LatestVisitBlock visit={overview?.latestVisit} onOpen={() => go("visits")} />
      <MedicinesBlock
        medications={overview?.medications ?? { activeCount: 0, sampleNames: [] }}
        onOpen={() => go("meds")}
      />
    </>
  );

  return (
    <Screen>
      <HomeHeader name={patient?.name} mrn={patient?.ref} />

      {overview ? (
        <ResultsBlock labs={overview.labs} onOpen={() => go("results")} />
      ) : null}

      {media.md ? (
        // Asymmetric on purpose: the richer latest-visit panel leads, medicines is a
        // calmer narrower companion. Not a 50/50 mirror of two identical cards.
        <XStack gap="$4" items="flex-start">
          <YStack flex={1.55}>
            <LatestVisitBlock
              visit={overview?.latestVisit}
              onOpen={() => go("visits")}
            />
          </YStack>
          <YStack flex={1}>
            <MedicinesBlock
              medications={
                overview?.medications ?? { activeCount: 0, sampleNames: [] }
              }
              onOpen={() => go("meds")}
            />
          </YStack>
        </XStack>
      ) : (
        <YStack gap="$4">{secondary}</YStack>
      )}

      <Section title="Go to">
        <QuickLinks onGo={go} />
      </Section>
    </Screen>
  );
}
