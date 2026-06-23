import { Protected } from "@/components/protected";
import { NavShell } from "@/components/ui";
import { Slot } from "expo-router";

export default function PatientLayout() {
  return (
    <Protected>
      <NavShell>
        <Slot />
      </NavShell>
    </Protected>
  );
}
