import { ArrowLeft } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, View } from "tamagui";
import { WebView } from "react-native-webview";
import { trpc } from "@/utils/trpc";

import { Platform } from "react-native";

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
        ...style,
      }}
      className={className}
      title="HTML Content"
    />
  );
};

export default function Prescriptions() {
  const { uuid, visit } = useLocalSearchParams<{
    uuid: string;
    visit: string;
  }>();

  const { data, isLoading } = trpc.patientPrescription.useQuery({ visit });

  return (
    <View flex={1}>
      <Button
        rounded={0}
        onPress={async () => {
          router.back();
        }}
      >
        <ArrowLeft /> Go to visits
      </Button>

      {isLoading && <Spinner size="large" />}
      {data && !isLoading && (
        <HTMLContentViewer
          html={data}
          style={{ width: "100%" }} // Adjust as needed
        />
      )}
    </View>
  );
}
