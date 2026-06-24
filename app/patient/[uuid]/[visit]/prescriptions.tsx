import { useState } from "react";
import { Maximize2, X } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Modal, Platform } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { DLBack, ErrorState, Skeleton } from "@/components/ui";
import { trpc } from "@/utils/trpc";

/**
 * Full-page HTML document viewer. Fills its container (no squeezing), scrolls, and
 * zooms: native WebView gets pinch-zoom + zoom controls; web uses a full iframe whose
 * content the browser can zoom. We inject a zoom-friendly viewport so the hospital's
 * HTML is never locked to a fixed scale.
 */
function HtmlDoc({ html }: { html: string }) {
  const withZoom = html.includes("user-scalable")
    ? html
    : `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes">${html}`;

  if (Platform.OS !== "web") {
    const { WebView } = require("react-native-webview");
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html: withZoom }}
        style={{ flex: 1, backgroundColor: "#fff" }}
        scalesPageToFit
        setBuiltInZoomControls
        setDisplayZoomControls={false}
        scrollEnabled
      />
    );
  }
  return (
    <iframe
      srcDoc={withZoom}
      style={{ border: "none", width: "100%", height: "100%", background: "#fff", display: "block" }}
      title="Document"
    />
  );
}

export default function Prescriptions() {
  const { uuid, visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientPrescription.useQuery({ visit });
  const [full, setFull] = useState(false);

  return (
    <YStack flex={1} bg="$appBg">
      {/* slim header */}
      <XStack items="center" justify="space-between" gap="$2" px="$4" pt="$3" pb="$2.5">
        <DLBack
          label="Visit"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(`/patient/${uuid}/visits` as any))}
        />
        <Text fontSize={15} fontWeight="800" color="$color12">
          Prescription
        </Text>
        <XStack
          items="center"
          gap="$1.5"
          bg="$surface"
          borderWidth={1}
          borderColor="$border"
          px="$2.5"
          height={32}
          rounded={16}
          onPress={() => data && setFull(true)}
          pressStyle={{ opacity: 0.7 }}
        >
          <Maximize2 size={14} color="$text2" />
          <Text fontSize={12} fontWeight="600" color="$text2">
            Full screen
          </Text>
        </XStack>
      </XStack>

      {isError ? (
        <YStack flex={1} px="$4">
          <ErrorState
            title="Couldn't load this prescription"
            detail="We couldn't reach your records right now. Please try again."
            onRetry={() => refetch()}
          />
        </YStack>
      ) : isLoading || !data ? (
        <YStack flex={1} p="$5" gap="$3" bg="$surface" mx="$4" rounded={12}>
          <Skeleton width="45%" height={22} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="90%" height={14} />
          <Skeleton width="85%" height={14} />
          <Skeleton width="60%" height={14} />
        </YStack>
      ) : (
        // Full-bleed document: fills the whole content area, scrolls + zooms inside.
        <YStack flex={1} bg="#fff">
          <HtmlDoc html={data.html} />
        </YStack>
      )}

      {/* True full-screen overlay (covers nav too) for max reading space + zoom. */}
      {full && data ? (
        <Modal visible animationType="slide" onRequestClose={() => setFull(false)}>
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
              <Text fontSize={15} fontWeight="800" color="$color12">
                Prescription
              </Text>
              <XStack
                width={36}
                height={36}
                rounded={20}
                bg="$surface2"
                items="center"
                justify="center"
                onPress={() => setFull(false)}
                pressStyle={{ opacity: 0.6 }}
              >
                <X size={20} color="$color12" />
              </XStack>
            </XStack>
            <YStack flex={1}>
              <HtmlDoc html={data.html} />
            </YStack>
          </YStack>
        </Modal>
      ) : null}
    </YStack>
  );
}
