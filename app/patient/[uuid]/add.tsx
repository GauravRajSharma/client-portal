import { router } from "expo-router";
import { ArrowLeft, ClipboardPlus } from "@tamagui/lucide-icons";
import { Text, XStack } from "tamagui";
import { AlphaGate, DLScreen } from "@/components/ui";

// Designed in the prototype (4-step add-result wizard). Read-only MVP -> alpha-gated.
export default function AddResult() {
  return (
    <DLScreen>
      <XStack items="center" gap="$2" onPress={() => router.back()} pressStyle={{ opacity: 0.6 }}>
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Back
        </Text>
      </XStack>
      <AlphaGate
        Icon={ClipboardPlus}
        title="Add a result yourself"
        detail="Record a test result from another lab, with its reference method and range. This MVP is view-only, so adding results arrives after alpha."
      />
    </DLScreen>
  );
}
