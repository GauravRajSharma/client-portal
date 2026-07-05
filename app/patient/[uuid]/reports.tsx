import { useState } from "react";
import { Modal } from "react-native";
import { FileText, X, C } from "@/components/ui/icons";
import { useLocalSearchParams } from "expo-router";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
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
        <VStack className="gap-[10px]">
          {data.map((r) => (
            <Pressable key={r.id} onPress={() => setOpen(r)} className="active:opacity-75">
              <DLCard className="p-[15px] gap-[7px]">
                <HStack className="items-center gap-[12px]">
                  <VStack className="w-[40px] h-[40px] rounded-[11px] bg-primarySoft items-center justify-center">
                    <FileText size={19} color={C.primary} />
                  </VStack>
                  <VStack className="flex-1 min-w-0">
                    <Text className="text-[15px] font-plex-bold text-fg" numberOfLines={1}>
                      {r.title}
                    </Text>
                    {r.date ? <Text className="text-[12px] text-text2">{r.date.slice(0, 10)}</Text> : null}
                  </VStack>
                  <Text className="text-[12.5px] font-plex-semibold text-primary">Read</Text>
                </HStack>
              </DLCard>
            </Pressable>
          ))}
        </VStack>
      )}

      {open ? (
        <Modal visible animationType="slide" onRequestClose={() => setOpen(null)}>
          <VStack className="flex-1 bg-surface">
            <HStack className="items-center justify-between px-[17px] pt-[30px] pb-[10px] border-b border-border bg-surface">
              <Text className="text-[15px] font-plex-bold text-fg flex-1" numberOfLines={1}>
                {open.title}
              </Text>
              <Pressable
                onPress={() => setOpen(null)}
                className="w-[36px] h-[36px] rounded-[20px] bg-surface2 items-center justify-center active:opacity-60"
              >
                <X size={20} color={C.fg} />
              </Pressable>
            </HStack>
            <VStack className="flex-1">
              <HtmlDoc html={open.html} />
            </VStack>
          </VStack>
        </Modal>
      ) : null}
    </DLScreen>
  );
}
