import { router } from "expo-router";
import { ArrowLeft, Building2 } from "@tamagui/lucide-icons";
import { Text, XStack } from "tamagui";
import { AlphaGate, DLScreen } from "@/components/ui";

// "My Hospitals & Labs" (connect multiple centres). Needs the app-account/DB -> alpha-gated.
export default function Hospitals() {
  return (
    <DLScreen>
      <XStack items="center" gap="$2" onPress={() => router.back()} pressStyle={{ opacity: 0.6 }}>
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Back
        </Text>
      </XStack>
      <AlphaGate
        Icon={Building2}
        title="My Hospitals & Labs"
        detail="Connect more than one hospital or diagnostic centre and see all your results in one place. This needs an app account, coming after alpha."
      />
    </DLScreen>
  );
}
