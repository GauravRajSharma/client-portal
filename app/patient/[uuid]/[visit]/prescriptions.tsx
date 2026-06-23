import { ArrowLeft, Eye, FileText } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import {
  Separator,
  Text,
  XStack,
  YStack,
  useMedia,
  useWindowDimensions,
} from "tamagui";
import { ErrorState, Panel, Screen, Skeleton } from "@/components/ui";
import { trpc } from "@/utils/trpc";

interface HTMLContentViewerProps {
  html: string;
  style?: React.CSSProperties | any; // Support both web and RN styles
  className?: string;
}

const HTMLContentViewer: React.FC<HTMLContentViewerProps> = ({
  html,
  style,
  className,
}) => {
  // For React Native
  if (Platform.OS !== "web") {
    const { WebView } = require("react-native-webview");
    return <WebView originWhitelist={["*"]} source={{ html }} style={style} />;
  }

  // For Web
  return (
    <iframe
      srcDoc={html}
      style={{
        border: "none",
        width: "100%",
        height: "100%",
        background: "transparent",
        ...style,
      }}
      className={className}
      title="Prescription"
    />
  );
};

/** Back to the visit list. A clear, large touch target. */
function BackButton() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <XStack
      items="center"
      gap="$2"
      self="flex-start"
      py="$2"
      px="$2.5"
      ml="$-2.5"
      rounded="$4"
      hoverStyle={{ bg: "$color2" }}
      pressStyle={{ opacity: 0.6 }}
      animation="quick"
      cursor="pointer"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(`/patient/${uuid}/visits` as any);
      }}
    >
      <ArrowLeft size={18} color="$color10" />
      <Text fontSize="$4" fontWeight="600" color="$color11">
        Back to visits
      </Text>
    </XStack>
  );
}

export default function Prescriptions() {
  const { visit } = useLocalSearchParams<{ uuid: string; visit: string }>();
  const media = useMedia();
  const { height } = useWindowDimensions();
  const { data, isLoading, isError, refetch } =
    trpc.patientPrescription.useQuery({ visit });

  // Give the embedded document a generous, stable canvas. The HTML scrolls inside.
  const viewerHeight = Math.max(420, Math.round(height * (media.md ? 0.72 : 0.6)));

  return (
    <Screen maxWidth={860}>
      <BackButton />

      <XStack items="center" gap="$2.5">
        <YStack p="$2" rounded="$4" bg="$color3">
          <FileText size={20} color="$color11" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text fontSize="$8" fontWeight="800" color="$color12">
            Prescription
          </Text>
          <XStack items="center" gap="$1.5">
            <Eye size={13} color="$color9" />
            <Text fontSize="$2" color="$color9">
              View only. This is a copy of your prescription.
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
        <Panel p="$0" overflow="hidden">
          {isLoading || !data ? (
            <YStack p="$5" gap="$3">
              <Skeleton width="45%" height={22} />
              <Skeleton width="70%" height={14} />
              <Separator borderColor="$borderColor" my="$2" />
              <Skeleton width="90%" height={14} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="60%" height={14} />
              <Skeleton width="80%" height={14} />
            </YStack>
          ) : (
            // Breathing room around the embedded document.
            <YStack p="$3" $md={{ p: "$5" }}>
              <YStack height={viewerHeight} rounded="$4" overflow="hidden">
                <HTMLContentViewer html={data.html} />
              </YStack>
            </YStack>
          )}
        </Panel>
      )}
    </Screen>
  );
}
