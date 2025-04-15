import { trpc } from "@/utils/trpc";

import { Redirect } from "expo-router";
import { Spinner, Text, View, YStack } from "tamagui";

export default function Index() {
  const { data, isLoading } = trpc.patient.useQuery();

  if (isLoading)
    return (
      <YStack height="100vh" justify="center" items="center">
        <Spinner size="large" />
      </YStack>
    );

  return <Redirect href={`/patient/${data?.uuid}/visits`} />;
}
