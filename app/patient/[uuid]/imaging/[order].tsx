import { useState } from "react";
import { Platform } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Download, Scan } from "@tamagui/lucide-icons";
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
 * image after first view, so re-opening never re-hits the server; this button is the
 * explicit "keep a copy on my device" affordance.
 */
async function saveImage(url: string, name: string): Promise<string> {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return "Downloaded";
  }
  const FileSystem = require("expo-file-system");
  const dest = `${FileSystem.documentDirectory}${name}`;
  await FileSystem.downloadAsync(url, dest);
  return "Saved to device";
}

function ImagePane({ image, index, width }: { image: ImagingImage; index: number; width: number }) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const uri = toApiUrl(image.url);

  const onSave = async () => {
    setState("saving");
    try {
      await saveImage(uri, `image-${index + 1}.jpg`);
      setState("done");
    } catch {
      setState("idle");
    }
  };

  return (
    <DLCard p="$2" gap="$2" overflow="hidden">
      <Image
        source={{ uri }}
        style={{ width: "100%", height: Math.round(width * 1.25), borderRadius: 12, backgroundColor: "#0b1f33" }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={200}
      />
      <XStack items="center" justify="space-between" px="$2" pb="$1">
        <Text fontSize={12} color="$text2">
          Image {index + 1}
        </Text>
        <XStack
          items="center"
          gap="$1.5"
          bg={state === "done" ? "$goodSoft" : "$primarySoft"}
          px="$3"
          height={34}
          rounded={10}
          onPress={state === "idle" ? onSave : undefined}
          pressStyle={state === "idle" ? { opacity: 0.7 } : undefined}
        >
          {state === "done" ? <Check size={14} color="$good" /> : <Download size={14} color="$primary" />}
          <Text fontSize={12.5} fontWeight="700" color={state === "done" ? "$good" : "$primary"}>
            {state === "saving" ? "Saving…" : state === "done" ? "Saved" : "Save"}
          </Text>
        </XStack>
      </XStack>
    </DLCard>
  );
}

export default function StudyViewer() {
  const { uuid, order } = useLocalSearchParams<{ uuid: string; order: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = trpc.patientImaging.useQuery();
  const study = (data ?? []).find((s) => s.orderId === order);
  const paneWidth = Math.min(width, 920) - 40;

  return (
    <DLScreen>
      <DLBack label="Imaging" onPress={() => router.replace(`/patient/${uuid}/imaging` as any)} />

      {isLoading ? (
        <SkeletonList count={2} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !study || !study.hasImages ? (
        <EmptyState
          Icon={Scan}
          title="No images for this study"
          detail="The images for this scan are not available."
        />
      ) : (
        <YStack gap="$3">
          <YStack px="$0.5" gap="$1">
            <Text fontSize={20} fontWeight="800" color="$color12">
              {study.name}
            </Text>
            <Text fontSize={12.5} color="$text2">
              {[study.date?.slice(0, 10), `${study.imageCount} image${study.imageCount > 1 ? "s" : ""}`]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </YStack>
          {study.images.map((img, i) => (
            <ImagePane key={i} image={img} index={i} width={paneWidth} />
          ))}
          <Text fontSize={11.5} color="$text3" text="center" px="$4" pt="$1">
            These are read-only copies of your scan. For the radiologist's report, see Documents.
          </Text>
        </YStack>
      )}
    </DLScreen>
  );
}
