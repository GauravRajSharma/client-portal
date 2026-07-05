import { useLocalSearchParams } from "expo-router";
import { ClipboardPlus } from "@/components/ui/icons";
import { AlphaGate, DLBack, DLScreen } from "@/components/ui";
import { backOr } from "@/utils/nav";

// Designed in the prototype (4-step add-result wizard). Read-only MVP -> alpha-gated.
export default function AddResult() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <DLScreen>
      <DLBack onPress={() => backOr(`/patient/${uuid}/home`)} />
      <AlphaGate
        Icon={ClipboardPlus}
        title="Add a result yourself"
        detail="Record a test result from another lab, with its reference method and range. This MVP is view-only, so adding results arrives after alpha."
      />
    </DLScreen>
  );
}
