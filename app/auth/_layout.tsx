import { Stack as RouterStack } from "expo-router";

export default function AuthLayout() {
  return (
    <RouterStack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
