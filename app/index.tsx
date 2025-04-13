import { SignInScreen } from "@/components/auth/sign-in";
import { Select, Stack, Text, View, XStack, YStack } from "tamagui";

export default function HomeScreen() {
  return (
    <XStack flex={1} p="$1" justify="center" minH="100vh">
      <Stack width="100%" justify="center" p="$4" maxW={600}>
        <SignInScreen />
      </Stack>
    </XStack>
  );
}
