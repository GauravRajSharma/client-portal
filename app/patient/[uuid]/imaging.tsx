import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  Activity,
  Bone,
  Brain,
  ChevronRight,
  FileText,
  Scan,
  ScanLine,
  C,
} from "@/components/ui/icons";
import type { ComponentType } from "react";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
import type { ImagingModality, ImagingStudy } from "@/server/dto";
import {
  DLCard,
  DLScreen,
  DLStatusPill,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { toApiUrl } from "@/utils/api";

const MODALITY_ICON: Record<ImagingModality, ComponentType<{ size?: number; color?: string }>> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  mammo: ScanLine,
  fluoro: ScanLine,
  dental: ScanLine,
  usg: Activity,
  other: Scan,
};

function statusPill(status?: string): { text: string; softBg: string; hex: string } {
  switch (status) {
    case "Completed":
      return { text: "text-good", softBg: "bg-goodSoft", hex: C.good };
    case "In progress":
    case "Received":
      return { text: "text-primary", softBg: "bg-primarySoft", hex: C.primary };
    case "Not done":
      return { text: "text-bad", softBg: "bg-badSoft", hex: C.bad };
    default:
      return { text: "text-text3", softBg: "bg-surface3", hex: C.text3 };
  }
}

function StudyCard({ study, onOpen }: { study: ImagingStudy; onOpen: () => void }) {
  const Icon = MODALITY_ICON[study.modality] ?? Scan;
  const sp = statusPill(study.status);
  const tappable = study.hasImages;
  return (
    <Pressable onPress={tappable ? onOpen : undefined} className={tappable ? "active:opacity-75" : undefined}>
      <DLCard className="p-[15px] gap-[12px]">
        <HStack className="items-center gap-[12px]">
          <VStack className="w-[42px] h-[42px] rounded-[12px] bg-primarySoft items-center justify-center">
            <Icon size={20} color={C.primary} />
          </VStack>
          <VStack className="flex-1 min-w-0 gap-[2px]">
            <Text className="text-[15px] font-plex-bold text-fg" numberOfLines={2}>
              {study.name}
            </Text>
            <HStack className="items-center gap-[7px]">
              {study.status ? <DLStatusPill label={study.status} text={sp.text} softBg={sp.softBg} hex={sp.hex} size="sm" /> : null}
              {study.date ? (
                <Text className="text-[12px] text-text2">
                  {study.date.slice(0, 10)}
                </Text>
              ) : null}
            </HStack>
          </VStack>
          {tappable ? <ChevronRight size={20} color={C.text3} /> : null}
        </HStack>

        {study.hasImages ? (
          <HStack className="gap-[7px] items-center">
            <Image
              source={{ uri: toApiUrl(study.images[0].thumbUrl) }}
              style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: "#0b1f33" }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
            <VStack className="flex-1 gap-[2px]">
              <Text className="text-[13px] font-plex-semibold text-primary">
                View {study.imageCount} image{study.imageCount > 1 ? "s" : ""}
              </Text>
              <Text className="text-[11.5px] text-text2">
                Tap to open. Save to your device for offline viewing.
              </Text>
            </VStack>
          </HStack>
        ) : study.reportOnly ? (
          <HStack className="items-center gap-[7px] bg-surface2 rounded-[10px] px-[12px] py-[10px] border border-border">
            <FileText size={15} color={C.text3} />
            <Text className="text-[12px] text-text2 flex-1">
              This scan is reported in writing. See it in Documents or your visit summary.
            </Text>
          </HStack>
        ) : (
          <Text className="text-[12px] text-text3 px-[2px]">
            Images are not available yet. They appear here once the scan is done.
          </Text>
        )}
      </DLCard>
    </Pressable>
  );
}

export default function Imaging() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientImaging.useQuery();

  return (
    <DLScreen>
      <DLTitle title="Imaging" subtitle="Your X-rays and scans." />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your imaging"
          detail="We couldn't reach the imaging service. Please try again."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={Scan}
          title="No imaging yet"
          detail="When you have an X-ray, ultrasound or other scan, it will appear here."
        />
      ) : (
        <VStack className="gap-[10px]">
          {data.map((s) => (
            <StudyCard
              key={s.orderId}
              study={s}
              onOpen={() => router.push(`/patient/${uuid}/imaging/${s.orderId}` as any)}
            />
          ))}
        </VStack>
      )}
    </DLScreen>
  );
}
