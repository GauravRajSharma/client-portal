import { LayoutGrid } from "@tamagui/lucide-icons";
import { EmptyState, Screen } from "@/components/ui";

// ponytail: placeholder — replaced by the Home/overview feature PR (redesign/home).
export default function Home() {
  return (
    <Screen>
      <EmptyState
        Icon={LayoutGrid}
        title="Your health, at a glance"
        detail="Your overview dashboard is on the way."
      />
    </Screen>
  );
}
