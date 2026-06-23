import { Pill } from "@tamagui/lucide-icons";
import { EmptyState, Screen } from "@/components/ui";

// ponytail: placeholder — replaced by the Medications feature PR (redesign/meds).
export default function Meds() {
  return (
    <Screen>
      <EmptyState
        Icon={Pill}
        title="Medicines"
        detail="Your active medicines and prescriptions will appear here."
      />
    </Screen>
  );
}
