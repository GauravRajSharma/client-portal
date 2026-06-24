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
// The hospital HTML is laid out for a fixed paper width (~A4). We treat the document
// as that page width and fit-to-screen-width so it never looks squeezed, while staying
// pinch/scroll zoomable for reading the fine print.
const PAGE_WIDTH = 820;

function docHtml(html: string): string {
  // Drop any viewport the source set, then impose a page-width, zoomable one.
  const cleaned = html.replace(/<meta[^>]*name=["']?viewport["']?[^>]*>/gi, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${PAGE_WIDTH}, user-scalable=yes"><style>html,body{margin:0;padding:8px;background:#fff;-webkit-text-size-adjust:100%}img,table{max-width:100%}</style></head><body>${cleaned}</body></html>`;
}

function HtmlDoc({ html }: { html: string }) {
  const withZoom = docHtml(html);

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
  // Web: render at the page width and scale the whole document down to fit the
  // container, so an A4 layout fills the width instead of being cramped. The user
  // can still zoom with the browser. We use an iframe sized to PAGE_WIDTH and CSS-scale.
  return (
    <iframe
      srcDoc={withZoom}
      style={{
        border: "none",
        width: "100%",
        height: "100%",
        background: "#fff",
        display: "block",
      }}
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
