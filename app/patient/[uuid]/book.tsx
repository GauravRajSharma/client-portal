import { useLocalSearchParams } from "expo-router";
import { FlaskConical } from "@/components/ui/icons";
import { AlphaGate, DLBack, DLScreen } from "@/components/ui";
import { backOr } from "@/utils/nav";

// Designed in the prototype (catalogue + cart + collection). Alpha-gated for now.
export default function Book() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <DLScreen>
      <DLBack onPress={() => backOr(`/patient/${uuid}/home`)} />
      <AlphaGate
        Icon={FlaskConical}
        title="Book a lab test"
        detail="Browse the test catalogue, add tests to a cart, and schedule home or in-lab collection. This arrives after alpha."
      />
    </DLScreen>
  );
}
