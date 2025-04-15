import { Protected } from "@/components/protected";
import { Stack } from "expo-router";

export default function PatientLayout() {
  return (
    <Protected>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Protected>
  );
}
