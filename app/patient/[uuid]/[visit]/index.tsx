import {
  DateText,
  EmptyState,
  ErrorState,
  Panel,
  Screen,
  Section,
  Skeleton,
  StatusPill,
} from "@/components/ui";
import type { VisitDetail, VisitType } from "@/server/dto";
import { trpc } from "@/utils/trpc";
import {
  Ambulance,
  ArrowLeft,
  Bed,
  BriefcaseMedical,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Pill,
  Stethoscope,
  Wallet,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { NamedExoticComponent } from "react";
import { Text, XStack, YStack, useMedia } from "tamagui";

const TYPE_ICON: Record<VisitType, NamedExoticComponent<any>> = {
  OPD: BriefcaseMedical,
  IPD: Bed,
  ER: Ambulance,
  OTHER: Stethoscope,
};

const TYPE_THEME: Record<VisitType, "neutral" | "error"> = {
  OPD: "neutral",
  IPD: "neutral",
  ER: "error",
  OTHER: "neutral",
};

/** Back to the visit list. Plain affordance, top-left, large touch target. */
function BackLink({ uuid }: { uuid: string }) {
  return (
    <XStack
      items="center"
      gap="$1.5"
      py="$2"
      pr="$3"
      self="flex-start"
      cursor="pointer"
      pressStyle={{ opacity: 0.6 }}
      hoverStyle={{ opacity: 0.8 }}
      accessibilityRole="button"
      accessibilityLabel="Back to visits"
      onPress={() => router.replace(`/patient/${uuid}/visits` as any)}
    >
      <ArrowLeft size={18} color="$color10" />
      <Text fontSize="$3" fontWeight="600" color="$color10">
        Visits
      </Text>
    </XStack>
  );
}

/** A labelled fact line inside the header panel. */
function Fact({
  Icon,
  label,
  value,
}: {
  Icon: NamedExoticComponent<any>;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <XStack items="center" gap="$2.5">
      <Icon size={16} color="$color9" />
      <Text fontSize="$3" color="$color9" width={92}>
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="600" color="$color12" flex={1}>
        {value}
      </Text>
    </XStack>
  );
}

/** A navigation affordance to a sub-screen (lab / prescription) for this visit. */
function LinkRow({
  Icon,
  title,
  detail,
  onPress,
}: {
  Icon: NamedExoticComponent<any>;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Panel
      p="$3.5"
      flex={1}
      cursor="pointer"
      pressStyle={{ bg: "$color2" }}
      hoverStyle={{ borderColor: "$color7" }}
      animation="quick"
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
    >
      <XStack items="center" gap="$3">
        <YStack
          width={40}
          height={40}
          rounded="$5"
          bg="$color3"
          items="center"
          justify="center"
        >
          <Icon size={20} color="$color11" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            {title}
          </Text>
          <Text fontSize="$2" color="$color9" numberOfLines={1}>
            {detail}
          </Text>
        </YStack>
        <ChevronRight size={20} color="$color8" />
      </XStack>
    </Panel>
  );
}

function VisitHeader({ visit }: { visit: VisitDetail }) {
  const Icon = TYPE_ICON[visit.type] ?? Stethoscope;
  const doc = visit.doctor
    ? [visit.doctor.name, visit.doctor.title].filter(Boolean).join(", ")
    : undefined;

  return (
    <Panel gap="$3.5" p="$4">
      <XStack items="center" gap="$3">
        <YStack
          width={48}
          height={48}
          rounded="$6"
          bg="$color3"
          items="center"
          justify="center"
        >
          <Icon size={24} color="$color11" />
        </YStack>
        <YStack flex={1} gap="$1.5">
          <XStack items="center" gap="$2" flexWrap="wrap">
            <StatusPill
              label={visit.type}
              theme={TYPE_THEME[visit.type]}
              size="sm"
            />
            <Text fontSize="$6" fontWeight="800" color="$color12">
              {visit.department ?? visit.typeLabel}
            </Text>
          </XStack>
          <DateText value={visit.date} fontSize="$3" color="$color10" />
        </YStack>
      </XStack>

      {(doc || visit.paymentMethod || visit.paymentType) && (
        <YStack
          gap="$2.5"
          pt="$3"
          borderTopWidth={1}
          borderColor="$borderColor"
        >
          <Fact Icon={Stethoscope} label="Seen by" value={doc} />
          <Fact
            Icon={Wallet}
            label="Payment"
            value={[visit.paymentMethod, visit.paymentType]
              .filter(Boolean)
              .join(" · ")}
          />
        </YStack>
      )}
    </Panel>
  );
}

function VisitDetailBody() {
  const media = useMedia();
  const { uuid, visit: visitId } = useLocalSearchParams<{
    uuid: string;
    visit: string;
  }>();
  const { data, isLoading, isError, refetch } = trpc.patientVisit.useQuery({
    visit: visitId,
  });

  if (isLoading) {
    return (
      <YStack gap="$4">
        <Panel gap="$3">
          <Skeleton width="50%" height={22} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={14} />
        </Panel>
        <Skeleton width="35%" height={16} />
        <YStack gap="$3" {...(media.md ? { flexDirection: "row" } : {})}>
          <Panel flex={1} gap="$2.5">
            <Skeleton width="60%" />
            <Skeleton width="80%" height={12} />
          </Panel>
          <Panel flex={1} gap="$2.5">
            <Skeleton width="60%" />
            <Skeleton width="80%" height={12} />
          </Panel>
        </YStack>
      </YStack>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load this visit"
        detail="Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        Icon={Stethoscope}
        title="Visit not found"
        detail="This visit may have been removed, or the link is no longer valid."
      />
    );
  }

  return (
    <YStack gap="$5">
      <VisitHeader visit={data} />

      {data.diagnoses && data.diagnoses.length > 0 ? (
        <Section title="Diagnoses">
          <Panel gap="$2.5">
            {data.diagnoses.map((dx, i) => (
              <XStack key={`${dx}-${i}`} items="center" gap="$2.5">
                <ClipboardList size={16} color="$color9" />
                <Text fontSize="$4" color="$color12" flex={1}>
                  {dx}
                </Text>
              </XStack>
            ))}
          </Panel>
        </Section>
      ) : null}

      <Section title="For this visit">
        <YStack gap="$3" {...(media.md ? { flexDirection: "row" } : {})}>
          <LinkRow
            Icon={FlaskConical}
            title="Lab results"
            detail="Tests and reference ranges"
            onPress={() =>
              router.push(`/patient/${uuid}/${visitId}/lab` as any)
            }
          />
          <LinkRow
            Icon={Pill}
            title="Prescription"
            detail="Medicines and instructions"
            onPress={() =>
              router.push(`/patient/${uuid}/${visitId}/prescriptions` as any)
            }
          />
        </YStack>
      </Section>
    </YStack>
  );
}

export default function VisitDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <Screen>
      <BackLink uuid={uuid} />
      <VisitDetailBody />
    </Screen>
  );
}
