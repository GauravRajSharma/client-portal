import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import React from "react";
import { Text, View } from "tamagui";
import { DEMO } from "@/utils/demo";

export function Protected({ children }: { children: React.ReactNode }) {
  // ponytail: demo mode has no hospital token; skip the guard so screens render.
  if (DEMO) return <>{children}</>;
  const { data, isLoading } = useQuery({
    queryKey: ["token"],
    queryFn: () => AsyncStorage.getItem("access:token"),
  });

  if (isLoading)
    return (
      <View>
        <Text>Loading</Text>
      </View>
    );

  if (!data) return <Redirect href="/auth/login" />;
  return children;
}
