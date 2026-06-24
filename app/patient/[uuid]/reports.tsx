import { useState } from "react";
import { Modal } from "react-native";
import { FileText, X } from "@tamagui/lucide-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import type { PatientReport } from "@/server/dto";
import {
  DLCard,
  DLScreen,
  DLTitle,
  EmptyState,
  ErrorState,
  HtmlDoc,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

/**
 * Reports — written radiology / procedure findings (OpenMRS result observations,
 * rendered HTML). Tap a report to read it full-page (zoomable).
 */
export default function Reports() {
  useLocalSearchParams<{ uuid: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientReports.useQuery();
  const [open, setOpen] = useState<PatientReport | null>(null);

  return (
    <DLScreen>
      <DLTitle title="Reports" subtitle="Radiology and procedure reports." />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title="No reports yet"
          detail="When a radiologist or doctor writes up a scan or procedure, the report appears here to read full screen."
        />
      ) : (
        <YStack gap="$2.5">
          {data.map((r) => (
            <DLCard key={r.id} p="$3.5" gap="$2" onPress={() => setOpen(r)} pressStyle={{ opacity: 0.75 }}>
              <XStack items="center" gap="$3">
                <YStack width={40} height={40} rounded={11} bg="$primarySoft" items="center" justify="center">
                  <FileText size={19} color="$primary" />
                </YStack>
                <YStack flex={1} minW={0}>
                  <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={1}>
                    {r.title}
                  </Text>
                  {r.date ? (
                    <Text fontSize={12} color="$text2">
                      {r.date.slice(0, 10)}
                    </Text>
                  ) : null}
                </YStack>
                <Text fontSize={12.5} fontWeight="600" color="$primary">
                  Read
                </Text>
              </XStack>
            </DLCard>
          ))}
        </YStack>
      )}

      {open ? (
        <Modal visible animationType="slide" onRequestClose={() => setOpen(null)}>
          <YStack flex={1} bg="#fff">
            <XStack
              items="center"
              justify="space-between"
              px="$4"
              pt="$6"
              pb="$2.5"
              borderBottomWidth={1}
              borderColor="$border"
              bg="$surface"
            >
              <Text fontSize={15} fontWeight="800" color="$color12" numberOfLines={1} flex={1}>
                {open.title}
              </Text>
              <XStack width={36} height={36} rounded={20} bg="$surface2" items="center" justify="center" onPress={() => setOpen(null)} pressStyle={{ opacity: 0.6 }}>
                <X size={20} color="$color12" />
              </XStack>
            </XStack>
            <YStack flex={1}>
              <HtmlDoc html={open.html} />
            </YStack>
          </YStack>
        </Modal>
      ) : null}
    </DLScreen>
  );
}
