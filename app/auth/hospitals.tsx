import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Building2,
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
} from "@tamagui/lucide-icons";
import { Spinner, Text, XStack, YStack } from "tamagui";
import {
  DLCard,
  DLScreen,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/utils/authClient";

export default function MyHospitals() {
  const { data, isLoading, isError, refetch } = trpc.myHospitals.useQuery();
  const enter = trpc.enterHospital.useMutation();
  const [entering, setEntering] = useState<string | null>(null);

  const open = async (server: string, uuid: string) => {
    setEntering(`${server}:${uuid}`);
    try {
      const res = await enter.mutateAsync({ server, uuid });
      await AsyncStorage.setItem("access:token", res.accessToken);
      router.replace(`/patient/${res.uuid}/home` as any);
    } catch {
      setEntering(null);
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch {}
    await AsyncStorage.removeItem("access:token");
    router.replace("/auth/login" as any);
  };

  return (
    <DLScreen maxWidth={620}>
      <DLTitle
        title="Your hospitals"
        subtitle="Pick a hospital to view, or add another from the network."
        action={
          <XStack
            items="center"
            gap="$1.5"
            px="$2.5"
            height={32}
            rounded={16}
            bg="$surface"
            borderWidth={1}
            borderColor="$border"
            onPress={signOut}
            pressStyle={{ opacity: 0.7 }}
          >
            <LogOut size={14} color="$text2" />
            <Text fontSize={12} fontWeight="600" color="$text2">
              Sign out
            </Text>
          </XStack>
        }
      />

      {/* Add a hospital — the network claim flow. */}
      <DLCard
        p="$3.5"
        gap="$3"
        onPress={() => router.push("/auth/hospital?claim=1" as any)}
        pressStyle={{ opacity: 0.8 }}
        borderColor="$primary"
      >
        <XStack items="center" gap="$3">
          <YStack width={42} height={42} rounded={12} bg="$primarySoft" items="center" justify="center">
            <Plus size={22} color="$primary" />
          </YStack>
          <YStack flex={1} minW={0}>
            <Text fontSize={15} fontWeight="700" color="$color12">
              Add hospital from network
            </Text>
            <Text fontSize={12} color="$text2">
              Verify your MRN to link another hospital's records.
            </Text>
          </YStack>
          <ChevronRight size={20} color="$text3" />
        </XStack>
      </DLCard>

      {isLoading ? (
        <SkeletonList count={2} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your hospitals"
          detail="Please try again."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={Building2}
          title="No hospitals linked yet"
          detail="Tap “Add hospital from network” to link your first hospital record to this account."
        />
      ) : (
        <YStack gap="$2.5">
          {data.map((h) => {
            const key = `${h.server}:${h.uuid}`;
            const busy = entering === key;
            return (
              <DLCard
                key={key}
                p="$3.5"
                onPress={busy ? undefined : () => open(h.server, h.uuid)}
                pressStyle={{ opacity: 0.8 }}
              >
                <XStack items="center" gap="$3">
                  <YStack width={44} height={44} rounded={12} bg="$primary" items="center" justify="center">
                    <Building2 size={20} color="$onPrimary" />
                  </YStack>
                  <YStack flex={1} minW={0} gap="$0.5">
                    <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={1}>
                      {h.hospitalName ?? h.prefix}
                    </Text>
                    <Text fontSize={12} color="$text2" numberOfLines={1}>
                      {[h.name, h.ref].filter(Boolean).join(" · ")}
                    </Text>
                  </YStack>
                  {busy ? <Spinner color="$primary" /> : <ChevronRight size={20} color="$text3" />}
                </XStack>
              </DLCard>
            );
          })}
        </YStack>
      )}

      <XStack gap="$2.5" p="$3" rounded={12} bg="$surface2" items="flex-start" mt="$1">
        <ShieldCheck size={15} color="$text3" style={{ marginTop: 2 }} />
        <Text fontSize={11.5} color="$text2" flex={1} lineHeight={16}>
          We store only your email and which hospitals you've linked. Your medical records stay in
          the hospital systems and are fetched only when you open them.
        </Text>
      </XStack>
    </DLScreen>
  );
}
