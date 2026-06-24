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
} from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Text, XStack, YStack } from "tamagui";
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

const MODALITY_ICON: Record<ImagingModality, NamedExoticComponent<any>> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  mammo: ScanLine,
  fluoro: ScanLine,
  dental: ScanLine,
  usg: Activity,
  other: Scan,
};

function statusPill(status?: string): { color: any; soft: any } {
  switch (status) {
    case "Completed":
      return { color: "$good", soft: "$goodSoft" };
    case "In progress":
    case "Received":
      return { color: "$primary", soft: "$primarySoft" };
    case "Not done":
      return { color: "$bad", soft: "$badSoft" };
    default:
      return { color: "$text3", soft: "$surface3" };
  }
}

function StudyCard({ study, onOpen }: { study: ImagingStudy; onOpen: () => void }) {
  const Icon = MODALITY_ICON[study.modality] ?? Scan;
  const sp = statusPill(study.status);
  const tappable = study.hasImages;
  return (
    <DLCard p="$3.5" gap="$3" onPress={tappable ? onOpen : undefined} pressStyle={tappable ? { opacity: 0.75 } : undefined}>
      <XStack items="center" gap="$3">
        <YStack width={42} height={42} rounded={12} bg="$primarySoft" items="center" justify="center">
          <Icon size={20} color="$primary" />
        </YStack>
        <YStack flex={1} minW={0} gap="$1">
          <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={2}>
            {study.name}
          </Text>
          <XStack items="center" gap="$2">
            {study.status ? <DLStatusPill label={study.status} color={sp.color} soft={sp.soft} size="sm" /> : null}
            {study.date ? (
              <Text fontSize={12} color="$text2">
                {study.date.slice(0, 10)}
              </Text>
            ) : null}
          </XStack>
        </YStack>
        {tappable ? <ChevronRight size={20} color="$text3" /> : null}
      </XStack>

      {study.hasImages ? (
        <XStack gap="$2" items="center">
          <Image
            source={{ uri: toApiUrl(study.images[0].thumbUrl) }}
            style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: "#0b1f33" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          <YStack flex={1} gap="$1">
            <Text fontSize={13} fontWeight="600" color="$primary">
              View {study.imageCount} image{study.imageCount > 1 ? "s" : ""}
            </Text>
            <Text fontSize={11.5} color="$text2">
              Tap to open. Save to your device for offline viewing.
            </Text>
          </YStack>
        </XStack>
      ) : study.reportOnly ? (
        <XStack items="center" gap="$2" bg="$surface2" rounded={10} px="$3" py="$2.5" borderWidth={1} borderColor="$border">
          <FileText size={15} color="$text3" />
          <Text fontSize={12} color="$text2" flex={1}>
            This scan is reported in writing. See it in Documents or your visit summary.
          </Text>
        </XStack>
      ) : (
        <Text fontSize={12} color="$text3" px="$1">
          Images are not available yet. They appear here once the scan is done.
        </Text>
      )}
    </DLCard>
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
        <YStack gap="$2.5">
          {data.map((s) => (
            <StudyCard
              key={s.orderId}
              study={s}
              onOpen={() => router.push(`/patient/${uuid}/imaging/${s.orderId}` as any)}
            />
          ))}
        </YStack>
      )}
    </DLScreen>
  );
}
