import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import React from "react";
import { Text, View } from "tamagui";

export function Protected({ children }: { children: React.ReactNode }) {
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
