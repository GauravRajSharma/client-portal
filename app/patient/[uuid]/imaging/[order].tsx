import { useState } from "react";
import { Modal, Platform, ScrollView as RNScrollView } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Download, Maximize2, Scan, X } from "@tamagui/lucide-icons";
import { Text, XStack, YStack, useWindowDimensions } from "tamagui";
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
      <YStack flex={1} bg="#05070a">
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
        <XStack
          position="absolute"
          t={0}
          l={0}
          r={0}
          items="center"
          justify="space-between"
          px="$4"
          pt="$6"
          pb="$3"
        >
          <YStack
            width={40}
            height={40}
            rounded={20}
            bg="rgba(255,255,255,0.14)"
            items="center"
            justify="center"
            onPress={onClose}
            pressStyle={{ opacity: 0.6 }}
          >
            <X size={20} color="#fff" />
          </YStack>
          <Text fontSize={13} fontWeight="600" color="rgba(255,255,255,0.9)">
            {page + 1} / {images.length}
          </Text>
          <XStack
            items="center"
            gap="$1.5"
            bg="rgba(255,255,255,0.14)"
            px="$3"
            height={40}
            rounded={20}
            onPress={onSave}
            pressStyle={{ opacity: 0.6 }}
          >
            {saved[page] ? <Check size={16} color="#7ee0a6" /> : <Download size={16} color="#fff" />}
            <Text fontSize={13} fontWeight="700" color="#fff">
              {saved[page] ? "Saved" : "Save"}
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </Modal>
  );
}

function Thumb({ image, index, width, onOpen }: { image: ImagingImage; index: number; width: number; onOpen: () => void }) {
  return (
    <DLCard p="$2" gap="$2" overflow="hidden" onPress={onOpen} pressStyle={{ opacity: 0.85 }}>
      <YStack>
        <Image
          source={{ uri: toApiUrl(image.url) }}
          style={{ width: "100%", height: Math.round(width * 1.2), borderRadius: 12, backgroundColor: "#0b1f33" }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
        />
        <XStack
          position="absolute"
          b="$3"
          r="$3"
          items="center"
          gap="$1.5"
          bg="rgba(5,7,10,0.6)"
          px="$2.5"
          height={32}
          rounded={16}
        >
          <Maximize2 size={14} color="#fff" />
          <Text fontSize={12} fontWeight="700" color="#fff">
            Full screen
          </Text>
        </XStack>
      </YStack>
      <Text fontSize={12} color="$text2" px="$2" pb="$1">
        Image {index + 1} · tap to open
      </Text>
    </DLCard>
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
        <YStack gap="$3">
          <YStack px="$0.5" gap="$1">
            <Text fontSize={20} fontWeight="800" color="$color12">
              {study.name}
            </Text>
            <Text fontSize={12.5} color="$text2">
              {[study.date?.slice(0, 10), `${study.imageCount} image${study.imageCount > 1 ? "s" : ""}`, "tap to view full screen"]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </YStack>
          {study.images.map((img, i) => (
            <Thumb key={i} image={img} index={i} width={paneWidth} onOpen={() => setFsIndex(i)} />
          ))}
          <Text fontSize={11.5} color="$text3" text="center" px="$4" pt="$1">
            Read-only copies of your scan. For the radiologist's report, see Documents.
          </Text>
        </YStack>
      )}

      {fsIndex !== null && study?.images ? (
        <FullScreenViewer images={study.images} index={fsIndex} onClose={() => setFsIndex(null)} />
      ) : null}
    </DLScreen>
  );
}
