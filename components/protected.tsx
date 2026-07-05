import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import React from "react";
import { Box, Text } from "@/components/ui/gs";

export function Protected({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["token"],
    queryFn: () => AsyncStorage.getItem("access:token"),
  });

  if (isLoading)
    return (
      <Box>
        <Text>Loading</Text>
      </Box>
    );

  if (!data) return <Redirect href="/auth/login" />;
  return children;
}
