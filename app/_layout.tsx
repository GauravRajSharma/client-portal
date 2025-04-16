import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

import { trpc } from "@/utils/trpc";
import "../tamagui-web.css";
import { TamaguiProvider } from "@tamagui/core";
import tamaguiConfig from "../tamagui.config";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PortalProvider } from "tamagui";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { asyncStoragePersister, queryStorePresistor } from "@/utils/mmkv";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError(error, query) {
      if ("data" in error) {
        const data = error.data as { code: string };

        if (data.code === "UNAUTHORIZED") return router.replace("/auth/login");

        return Alert.alert("Error Occurred:", error.message);
      }
    },
  }),
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      fetch(url, options) {
        console.log({ url });
        return fetch(url, options);
      },
      // [todo]: make it dynamic for the production level servers
      url: "http://192.168.1.70:8081/api/trpc",

      // You can pass any HTTP headers you wish here
      async headers() {
        const token = await AsyncStorage.getItem("access:token");

        return {
          authorization: token ?? "no-token",
        };
      },
    }),
  ],
});

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
      <PersistQueryClientProvider
        persistOptions={{ persister: asyncStoragePersister }}
        client={queryClient}
      >
        <TamaguiProvider config={tamaguiConfig}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
              <PortalProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </PortalProvider>
            </SafeAreaView>
          </SafeAreaProvider>
        </TamaguiProvider>
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
