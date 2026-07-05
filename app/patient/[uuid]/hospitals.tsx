import { useLocalSearchParams } from "expo-router";
import { Building2 } from "@/components/ui/icons";
import { AlphaGate, DLBack, DLScreen } from "@/components/ui";
import { backOr } from "@/utils/nav";

// "My Hospitals & Labs" (connect multiple centres). Needs the app-account/DB -> alpha-gated.
export default function Hospitals() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return (
    <DLScreen>
      <DLBack onPress={() => backOr(`/patient/${uuid}/home`)} />
      <AlphaGate
        Icon={Building2}
        title="My Hospitals & Labs"
        detail="Connect more than one hospital or diagnostic centre and see all your results in one place. This needs an app account, coming after alpha."
      />
    </DLScreen>
  );
}
