import {
  Ambulance,
  Bed,
  BriefcaseMedical,
  ClipboardList,
  FlaskConical,
  Pill,
  Stethoscope,
  Wallet,
  C,
} from "@/components/ui/icons";
import { router, useLocalSearchParams } from "expo-router";
import type { ComponentType } from "react";
import { HStack, VStack, Text } from "@/components/ui/gs";
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

const TYPE_META: Record<
  VisitType,
  { Icon: ComponentType<{ size?: number; color?: string }>; text: string; softBg: string; hex: string }
> = {
  OPD: { Icon: BriefcaseMedical, text: "text-primary", softBg: "bg-primarySoft", hex: C.primary },
  IPD: { Icon: Bed, text: "text-primary", softBg: "bg-primarySoft", hex: C.primary },
  ER: { Icon: Ambulance, text: "text-bad", softBg: "bg-badSoft", hex: C.bad },
  OTHER: { Icon: Stethoscope, text: "text-text2", softBg: "bg-surface3", hex: C.text2 },
};

/** One labelled fact inside the hero card. */
function Fact({ Icon, label, value }: { Icon: ComponentType<{ size?: number; color?: string }>; label: string; value?: string }) {
  if (!value) return null;
  return (
    <HStack className="items-center gap-[10px]">
      <Icon size={16} color={C.text3} />
      <Text className="text-[13px] text-text2 w-[84px]">
        {label}
      </Text>
      <Text className="text-[13.5px] font-plex-semibold text-fg flex-1">
        {value}
      </Text>
    </HStack>
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
        <VStack className="gap-[15px]">
          {/* Hero */}
          <DLCard className="p-[17px] gap-[15px]">
            <HStack className="items-center gap-[12px]">
              <VStack className={`w-[48px] h-[48px] rounded-[14px] items-center justify-center ${meta.softBg}`}>
                <meta.Icon size={24} color={meta.hex} />
              </VStack>
              <VStack className="flex-1 gap-[4px]">
                <HStack className="items-center gap-[7px]">
                  <DLStatusPill label={data.type} text={meta.text} softBg={meta.softBg} hex={meta.hex} size="sm" />
                  <Text className="text-[18px] font-plex-bold text-fg flex-1" numberOfLines={1}>
                    {data.department ?? data.typeLabel}
                  </Text>
                </HStack>
                {data.date ? (
                  <Text className="text-[12.5px] text-text2">
                    {data.date.slice(0, 10)}
                  </Text>
                ) : null}
              </VStack>
            </HStack>

            {(doc || data.paymentMethod || data.paymentType) ? (
              <VStack className="gap-[10px] pt-[12px] border-t border-border">
                <Fact Icon={Stethoscope} label="Seen by" value={doc} />
                <Fact Icon={Wallet} label="Payment" value={[data.paymentMethod, data.paymentType].filter(Boolean).join(" · ") || undefined} />
              </VStack>
            ) : null}
          </DLCard>

          {/* Diagnoses */}
          {data.diagnoses && data.diagnoses.length > 0 ? (
            <DLCard className="p-[17px] gap-[10px]">
              <Text className="text-[14.5px] font-plex-bold text-fg">
                Diagnoses
              </Text>
              {data.diagnoses.map((dx, i) => (
                <HStack key={`${dx}-${i}`} className="items-start gap-[10px]">
                  <VStack className="mt-[2px]">
                    <ClipboardList size={15} color={C.text3} />
                  </VStack>
                  <Text className="text-[14px] text-fg flex-1 leading-[20px]">
                    {dx}
                  </Text>
                </HStack>
              ))}
            </DLCard>
          ) : null}

          {/* Sub-screens */}
          <DLCard className="overflow-hidden">
            <Text className="text-[14.5px] font-plex-bold text-fg px-[15px] pt-[15px] pb-[2px]">
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
        </VStack>
      )}
    </DLScreen>
  );
}
