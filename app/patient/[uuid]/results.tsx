import { FlaskConical } from "@tamagui/lucide-icons";
import { EmptyState, Screen } from "@/components/ui";

// ponytail: placeholder — replaced by the Lab results feature PR (redesign/labs).
export default function Results() {
  return (
    <Screen>
      <EmptyState
        Icon={FlaskConical}
        title="Lab results"
        detail="All your test results, with trends, are coming here."
      />
    </Screen>
  );
}
