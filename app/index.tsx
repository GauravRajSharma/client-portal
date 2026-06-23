import { trpc } from "@/utils/trpc";

import { Redirect } from "expo-router";
import { Spinner, YStack } from "tamagui";

export default function Index() {
  const { data, isLoading } = trpc.patient.useQuery();

  if (isLoading)
    return (
      <YStack
        flex={1}
        height="100vh"
        justify="center"
        items="center"
        bg="$background"
      >
        <Spinner size="large" color="$accent9" />
      </YStack>
    );

  if (!data?.id) return <Redirect href="/auth/login" />;

  return <Redirect href={`/patient/${data.id}/home` as any} />;
}
