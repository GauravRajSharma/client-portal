import { trpc } from "@/utils/trpc";
import { authClient } from "@/utils/authClient";

import { Redirect } from "expo-router";
import { Spinner, YStack } from "tamagui";

/**
 * Entry routing:
 *  - a valid hospital token (access:token) -> resume that hospital's portal
 *  - else an app-account session -> the "my hospitals" picker
 *  - else -> login
 */
export default function Index() {
  const session = authClient.useSession();
  const { data, isLoading } = trpc.patient.useQuery(undefined, { retry: false });

  if (isLoading || session.isPending)
    return (
      <YStack flex={1} height="100vh" justify="center" items="center" bg="$background">
        <Spinner size="large" color="$accent9" />
      </YStack>
    );

  if (data?.id) return <Redirect href={`/patient/${data.id}/home` as any} />;
  if (session.data?.user) return <Redirect href={"/auth/hospitals" as any} />;
  return <Redirect href="/auth/login" />;
}
