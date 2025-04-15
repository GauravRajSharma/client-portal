import { ArrowLeft } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, View } from "tamagui";
import { WebView } from "react-native-webview";
import { trpc } from "@/utils/trpc";

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
        <WebView
          style={{
            backgroundColor: "white",
            transformOrigin: "top left",
          }}
          originWhitelist={["*"]}
          source={{ html: data }}
          scalesPageToFit={false}
        />
      )}
    </View>
  );
}
