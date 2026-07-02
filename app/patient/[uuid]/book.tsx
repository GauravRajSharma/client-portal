import { useLocalSearchParams } from "expo-router";
import { ArrowLeft, FlaskConical } from "@tamagui/lucide-icons";
import { Text, XStack } from "tamagui";
import { AlphaGate, DLScreen } from "@/components/ui";
import { backOr } from "@/utils/nav";

// Designed in the prototype (catalogue + cart + collection). Alpha-gated for now.
export default function Book() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <DLScreen>
      <XStack items="center" gap="$2" onPress={() => backOr(`/patient/${uuid}/home`)} pressStyle={{ opacity: 0.6 }}>
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Back
        </Text>
      </XStack>
      <AlphaGate
        Icon={FlaskConical}
        title="Book a lab test"
        detail="Browse the test catalogue, add tests to a cart, and schedule home or in-lab collection. This arrives after alpha."
      />
    </DLScreen>
  );
}
