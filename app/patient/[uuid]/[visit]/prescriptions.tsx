import { Eye, FileText } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import { Text, XStack, YStack, useMedia, useWindowDimensions } from "tamagui";
import { DLBack, DLCard, DLScreen, ErrorState, Skeleton } from "@/components/ui";
import { trpc } from "@/utils/trpc";

/** Render the prescription HTML: iframe on web, WebView on native. */
function HTMLContentViewer({ html }: { html: string }) {
  if (Platform.OS !== "web") {
    const { WebView } = require("react-native-webview");
    return <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1, backgroundColor: "transparent" }} />;
  }
  return (
    <iframe
      srcDoc={html}
      style={{ border: "none", width: "100%", height: "100%", background: "transparent" }}
      title="Prescription"
    />
  );
}

export default function Prescriptions() {
  const { uuid, visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const media = useMedia();
  const { height } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = trpc.patientPrescription.useQuery({ visit });

  // Give the embedded document a generous, stable canvas; the HTML scrolls inside.
  const viewerHeight = Math.max(420, Math.round(height * (media.md ? 0.72 : 0.6)));

  return (
    <DLScreen maxWidth={860}>
      <DLBack
        label="Visit"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(`/patient/${uuid}/visits` as any))}
      />

      <XStack items="center" gap="$3" px="$0.5">
        <YStack width={44} height={44} rounded={12} bg="$primarySoft" items="center" justify="center">
          <FileText size={22} color="$primary" />
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontSize={20} fontWeight="800" color="$color12">
            Prescription
          </Text>
          <XStack items="center" gap="$1.5">
            <Eye size={13} color="$text3" />
            <Text fontSize={12} color="$text2">
              View only. A copy of your prescription.
            </Text>
          </XStack>
        </YStack>
      </XStack>

      {isError ? (
        <ErrorState
          title="Couldn't load this prescription"
          detail="We couldn't reach your records right now. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <DLCard p="$0" overflow="hidden">
          {isLoading || !data ? (
            <YStack p="$5" gap="$3">
              <Skeleton width="45%" height={22} />
              <Skeleton width="70%" height={14} />
              <Skeleton width="90%" height={14} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="60%" height={14} />
            </YStack>
          ) : (
            <YStack p="$3" $md={{ p: "$5" }}>
              <YStack height={viewerHeight} rounded={12} overflow="hidden">
                <HTMLContentViewer html={data.html} />
              </YStack>
            </YStack>
          )}
        </DLCard>
      )}
    </DLScreen>
  );
}
