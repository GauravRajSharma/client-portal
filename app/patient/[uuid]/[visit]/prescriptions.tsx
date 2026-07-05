import { useState } from "react";
import { Maximize2, X, C } from "@/components/ui/icons";
import { router, useLocalSearchParams } from "expo-router";
import { Modal } from "react-native";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
import { DLBack, ErrorState, HtmlDoc, Skeleton } from "@/components/ui";
import { trpc } from "@/utils/trpc";

export default function Prescriptions() {
  const { uuid, visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientPrescription.useQuery({ visit });
  const [full, setFull] = useState(false);

  return (
    <VStack className="flex-1 bg-appBg">
      {/* slim header */}
      <HStack className="items-center justify-between gap-[7px] px-[17px] pt-[12px] pb-[10px]">
        <DLBack
          label="Visit"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(`/patient/${uuid}/visits` as any))}
        />
        <Text className="text-[15px] font-plex-bold text-fg">
          Prescription
        </Text>
        <Pressable
          className="flex-row items-center gap-[4px] bg-surface border border-border px-[10px] h-[32px] rounded-[16px] active:opacity-70"
          onPress={() => data && setFull(true)}
        >
          <Maximize2 size={14} color={C.text2} />
          <Text className="text-[12px] font-plex-semibold text-text2">
            Full screen
          </Text>
        </Pressable>
      </HStack>

      {isError ? (
        <VStack className="flex-1 px-[17px]">
          <ErrorState
            title="Couldn't load this prescription"
            detail="We couldn't reach your records right now. Please try again."
            onRetry={() => refetch()}
          />
        </VStack>
      ) : isLoading || !data ? (
        <VStack className="flex-1 p-[23px] gap-[12px] bg-surface mx-[17px] rounded-[12px]">
          <Skeleton className="w-[45%] h-[22px]" />
          <Skeleton className="w-[70%] h-[14px]" />
          <Skeleton className="w-[90%] h-[14px]" />
          <Skeleton className="w-[85%] h-[14px]" />
          <Skeleton className="w-[60%] h-[14px]" />
        </VStack>
      ) : (
        // Full-bleed document: fills the whole content area, scrolls + zooms inside.
        <VStack className="flex-1" style={{ backgroundColor: "#fff" }}>
          <HtmlDoc html={data.html} />
        </VStack>
      )}

      {/* True full-screen overlay (covers nav too) for max reading space + zoom. */}
      {full && data ? (
        <Modal visible animationType="slide" onRequestClose={() => setFull(false)}>
          <VStack className="flex-1" style={{ backgroundColor: "#fff" }}>
            <HStack className="items-center justify-between px-[17px] pt-[30px] pb-[10px] border-b border-border bg-surface">
              <Text className="text-[15px] font-plex-bold text-fg">
                Prescription
              </Text>
              <Pressable
                className="w-[36px] h-[36px] rounded-[20px] bg-surface2 items-center justify-center active:opacity-60"
                onPress={() => setFull(false)}
              >
                <X size={20} color={C.fg} />
              </Pressable>
            </HStack>
            <VStack className="flex-1">
              <HtmlDoc html={data.html} />
            </VStack>
          </VStack>
        </Modal>
      ) : null}
    </VStack>
  );
}
