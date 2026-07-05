import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Building2,
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
  C,
} from "@/components/ui/icons";
import { Spinner, Text, HStack, VStack, Pressable } from "@/components/ui/gs";
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
          <Pressable
            onPress={signOut}
            className="flex-row items-center gap-[4px] px-[10px] h-[32px] rounded-[16px] bg-surface border border-border active:opacity-70"
          >
            <LogOut size={14} color={C.text2} />
            <Text className="text-[12px] font-plex-semibold text-text2">Sign out</Text>
          </Pressable>
        }
      />

      {/* Add a hospital — the network claim flow. */}
      <Pressable
        onPress={() => router.push("/auth/hospital?claim=1" as any)}
        className="active:opacity-80"
      >
        <DLCard className="p-[15px] gap-[12px] border-primary">
          <HStack className="items-center gap-[12px]">
            <VStack className="w-[42px] h-[42px] rounded-[12px] bg-primarySoft items-center justify-center">
              <Plus size={22} color={C.primary} />
            </VStack>
            <VStack className="flex-1 min-w-0">
              <Text className="text-[15px] font-plex-bold text-fg">
                Add hospital from network
              </Text>
              <Text className="text-[12px] text-text2">
                Verify your MRN to link another hospital's records.
              </Text>
            </VStack>
            <ChevronRight size={20} color={C.text3} />
          </HStack>
        </DLCard>
      </Pressable>

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
        <VStack className="gap-[10px]">
          {data.map((h) => {
            const key = `${h.server}:${h.uuid}`;
            const busy = entering === key;
            return (
              <Pressable
                key={key}
                onPress={busy ? undefined : () => open(h.server, h.uuid)}
                className="active:opacity-80"
              >
                <DLCard className="p-[15px]">
                  <HStack className="items-center gap-[12px]">
                    <VStack className="w-[44px] h-[44px] rounded-[12px] bg-primary items-center justify-center">
                      <Building2 size={20} color={C.onPrimary} />
                    </VStack>
                    <VStack className="flex-1 min-w-0 gap-[1px]">
                      <Text className="text-[15px] font-plex-bold text-fg" numberOfLines={1}>
                        {h.hospitalName ?? h.prefix}
                      </Text>
                      <Text className="text-[12px] text-text2" numberOfLines={1}>
                        {[h.name, h.ref].filter(Boolean).join(" · ")}
                      </Text>
                    </VStack>
                    {busy ? <Spinner color={C.primary} /> : <ChevronRight size={20} color={C.text3} />}
                  </HStack>
                </DLCard>
              </Pressable>
            );
          })}
        </VStack>
      )}

      <HStack className="gap-[10px] p-[12px] rounded-[12px] bg-surface2 items-start mt-[2px]">
        <ShieldCheck size={15} color={C.text3} style={{ marginTop: 2 }} />
        <Text className="text-[11.5px] text-text2 flex-1 leading-[16px]">
          We store only your email and which hospitals you've linked. Your medical records stay in
          the hospital systems and are fetched only when you open them.
        </Text>
      </HStack>
    </DLScreen>
  );
}
