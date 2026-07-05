import { useState } from "react";
import { Modal, Platform, ScrollView as RNScrollView, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Download, Maximize2, Scan, X } from "@/components/ui/icons";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
import type { ImagingImage } from "@/server/dto";
import {
  DLBack,
  DLCard,
  DLScreen,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { toApiUrl } from "@/utils/api";

/**
 * Save a rendered image for offline viewing. expo-image already disk-caches every
 * image after first view; this is the explicit "keep a copy on my device" affordance.
 */
async function saveImage(url: string, name: string): Promise<void> {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  const FileSystem = require("expo-file-system");
  await FileSystem.downloadAsync(url, `${FileSystem.documentDirectory}${name}`);
}

/** Full-screen dark viewer: swipe between images, zoom-to-fit, close, save. */
function FullScreenViewer({
  images,
  index,
  onClose,
}: {
  images: ImagingImage[];
  index: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(index);
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  const onSave = async () => {
    await saveImage(toApiUrl(images[page].url), `xray-${page + 1}.jpg`);
    setSaved((s) => ({ ...s, [page]: true }));
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} transparent={false}>
      <VStack className="flex-1 bg-[#05070a]">
        <RNScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: index * width, y: 0 }}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {images.map((img, i) => (
            <Image
              key={i}
              source={{ uri: toApiUrl(img.url) }}
              style={{ width, height }}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={150}
            />
          ))}
        </RNScrollView>

        {/* Top controls overlaid on the image */}
        <HStack className="absolute top-0 left-0 right-0 items-center justify-between px-[17px] pt-[30px] pb-[12px]">
          <Pressable
            onPress={onClose}
            className="w-[40px] h-[40px] rounded-[20px] bg-[rgba(255,255,255,0.14)] items-center justify-center active:opacity-60"
          >
            <X size={20} color="#fff" />
          </Pressable>
          <Text className="text-[13px] font-plex-semibold text-[rgba(255,255,255,0.9)]">
            {page + 1} / {images.length}
          </Text>
          <Pressable
            onPress={onSave}
            className="flex-row items-center gap-[4px] bg-[rgba(255,255,255,0.14)] px-[12px] h-[40px] rounded-[20px] active:opacity-60"
          >
            {saved[page] ? <Check size={16} color="#7ee0a6" /> : <Download size={16} color="#fff" />}
            <Text className="text-[13px] font-plex-bold text-[#fff]">
              {saved[page] ? "Saved" : "Save"}
            </Text>
          </Pressable>
        </HStack>
      </VStack>
    </Modal>
  );
}

function Thumb({ image, index, width, onOpen }: { image: ImagingImage; index: number; width: number; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} className="active:opacity-85">
      <DLCard className="p-[7px] gap-[7px] overflow-hidden">
        <VStack>
          <Image
            source={{ uri: toApiUrl(image.url) }}
            style={{ width: "100%", height: Math.round(width * 1.2), borderRadius: 12, backgroundColor: "#0b1f33" }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
          <HStack className="absolute bottom-[12px] right-[12px] items-center gap-[4px] bg-[rgba(5,7,10,0.6)] px-[10px] h-[32px] rounded-[16px]">
            <Maximize2 size={14} color="#fff" />
            <Text className="text-[12px] font-plex-bold text-[#fff]">
              Full screen
            </Text>
          </HStack>
        </VStack>
        <Text className="text-[12px] text-text2 px-[7px] pb-[2px]">
          Image {index + 1} · tap to open
        </Text>
      </DLCard>
    </Pressable>
  );
}

export default function StudyViewer() {
  const { uuid, order } = useLocalSearchParams<{ uuid: string; order: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = trpc.patientImaging.useQuery();
  const study = (data ?? []).find((s) => s.orderId === order);
  const paneWidth = Math.min(width, 920) - 40;
  const [fsIndex, setFsIndex] = useState<number | null>(null);

  return (
    <DLScreen>
      <DLBack label="Imaging" onPress={() => router.replace(`/patient/${uuid}/imaging` as any)} />

      {isLoading ? (
        <SkeletonList count={2} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !study || !study.hasImages ? (
        <EmptyState Icon={Scan} title="No images for this study" detail="The images for this scan are not available." />
      ) : (
        <VStack className="gap-[12px]">
          <VStack className="px-[1px] gap-[2px]">
            <Text className="text-[20px] font-plex-bold text-fg">
              {study.name}
            </Text>
            <Text className="text-[12.5px] text-text2">
              {[study.date?.slice(0, 10), `${study.imageCount} image${study.imageCount > 1 ? "s" : ""}`, "tap to view full screen"]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </VStack>
          {study.images.map((img, i) => (
            <Thumb key={i} image={img} index={i} width={paneWidth} onOpen={() => setFsIndex(i)} />
          ))}
          <Text className="text-[11.5px] text-text3 text-center px-[17px] pt-[2px]">
            Read-only copies of your scan. For the radiologist's report, see Documents.
          </Text>
        </VStack>
      )}

      {fsIndex !== null && study?.images ? (
        <FullScreenViewer images={study.images} index={fsIndex} onClose={() => setFsIndex(null)} />
      ) : null}
    </DLScreen>
  );
}
