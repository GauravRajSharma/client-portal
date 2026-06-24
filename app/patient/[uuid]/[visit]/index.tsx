import {
  Ambulance,
  Bed,
  BriefcaseMedical,
  ClipboardList,
  FlaskConical,
  Pill,
  Stethoscope,
  Wallet,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { NamedExoticComponent } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { VisitDetail, VisitType } from "@/server/dto";
import {
  DLBack,
  DLCard,
  DLNavRow,
  DLScreen,
  DLStatusPill,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

const TYPE_META: Record<VisitType, { Icon: NamedExoticComponent<any>; color: any; soft: any }> = {
  OPD: { Icon: BriefcaseMedical, color: "$primary", soft: "$primarySoft" },
  IPD: { Icon: Bed, color: "$primary", soft: "$primarySoft" },
  ER: { Icon: Ambulance, color: "$bad", soft: "$badSoft" },
  OTHER: { Icon: Stethoscope, color: "$text2", soft: "$surface3" },
};

/** One labelled fact inside the hero card. */
function Fact({ Icon, label, value }: { Icon: NamedExoticComponent<any>; label: string; value?: string }) {
  if (!value) return null;
  return (
    <XStack items="center" gap="$2.5">
      <Icon size={16} color="$text3" />
      <Text fontSize={13} color="$text2" width={84}>
        {label}
      </Text>
      <Text fontSize={13.5} fontWeight="600" color="$color12" flex={1}>
        {value}
      </Text>
    </XStack>
  );
}

export default function VisitDetailScreen() {
  const { uuid, visit: visitId } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientVisit.useQuery({ visit: visitId });

  const meta = data ? TYPE_META[data.type] ?? TYPE_META.OTHER : TYPE_META.OTHER;
  const doc = data?.doctor ? [data.doctor.name, data.doctor.title].filter(Boolean).join(", ") : undefined;

  return (
    <DLScreen>
      <DLBack label="Visits" onPress={() => router.replace(`/patient/${uuid}/visits` as any)} />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState title="Couldn't load this visit" detail="Check your connection and try again." onRetry={() => refetch()} />
      ) : !data ? (
        <EmptyState Icon={Stethoscope} title="Visit not found" detail="This visit may have been removed, or the link is no longer valid." />
      ) : (
        <YStack gap="$3.5">
          {/* Hero */}
          <DLCard p="$4" gap="$3.5">
            <XStack items="center" gap="$3">
              <YStack width={48} height={48} rounded={14} bg={meta.soft} items="center" justify="center">
                <meta.Icon size={24} color={meta.color} />
              </YStack>
              <YStack flex={1} gap="$1.5">
                <XStack items="center" gap="$2">
                  <DLStatusPill label={data.type} color={meta.color} soft={meta.soft} size="sm" />
                  <Text fontSize={18} fontWeight="800" color="$color12" numberOfLines={1} flex={1}>
                    {data.department ?? data.typeLabel}
                  </Text>
                </XStack>
                {data.date ? (
                  <Text fontSize={12.5} color="$text2">
                    {data.date.slice(0, 10)}
                  </Text>
                ) : null}
              </YStack>
            </XStack>

            {(doc || data.paymentMethod || data.paymentType) ? (
              <YStack gap="$2.5" pt="$3" borderTopWidth={1} borderColor="$border">
                <Fact Icon={Stethoscope} label="Seen by" value={doc} />
                <Fact Icon={Wallet} label="Payment" value={[data.paymentMethod, data.paymentType].filter(Boolean).join(" · ") || undefined} />
              </YStack>
            ) : null}
          </DLCard>

          {/* Diagnoses */}
          {data.diagnoses && data.diagnoses.length > 0 ? (
            <DLCard p="$4" gap="$2.5">
              <Text fontSize={14.5} fontWeight="700" color="$color12">
                Diagnoses
              </Text>
              {data.diagnoses.map((dx, i) => (
                <XStack key={`${dx}-${i}`} items="flex-start" gap="$2.5">
                  <YStack mt="$1">
                    <ClipboardList size={15} color="$text3" />
                  </YStack>
                  <Text fontSize={14} color="$color12" flex={1} lineHeight={20}>
                    {dx}
                  </Text>
                </XStack>
              ))}
            </DLCard>
          ) : null}

          {/* Sub-screens */}
          <DLCard overflow="hidden">
            <Text fontSize={14.5} fontWeight="700" color="$color12" px="$3.5" pt="$3.5" pb="$1">
              For this visit
            </Text>
            <DLNavRow
              Icon={FlaskConical}
              title="Lab results"
              detail="Tests and reference ranges"
              onPress={() => router.push(`/patient/${uuid}/${visitId}/lab` as any)}
            />
            <DLNavRow
              Icon={Pill}
              title="Prescription"
              detail="Medicines and instructions"
              onPress={() => router.push(`/patient/${uuid}/${visitId}/prescriptions` as any)}
              border
            />
          </DLCard>
        </YStack>
      )}
    </DLScreen>
  );
}
