import { User } from "@tamagui/lucide-icons";
import { EmptyState, Screen } from "@/components/ui";

// ponytail: placeholder — replaced by the Profile feature PR (redesign/profile).
export default function Profile() {
  return (
    <Screen>
      <EmptyState
        Icon={User}
        title="Profile"
        detail="Your details, hospital info, language and sign-out will live here."
      />
    </Screen>
  );
}
