import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

import { useColorScheme } from "@/hooks/useColorScheme";
import { trpc } from "@/utils/trpc";
import "../tamagui-web.css";
import { TamaguiProvider } from "@tamagui/core";
import tamaguiConfig from "../tamagui.config";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { PortalProvider, Text } from "tamagui";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // [todo]: make it dynamic for the production level servers
      url: "http://192.168.1.70:8081/api/trpc",

      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          // authorization: getAuthCookie(),
        };
      },
    }),
  ],
});

function Application() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
              <PortalProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </PortalProvider>
            </SafeAreaView>
          </SafeAreaProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
