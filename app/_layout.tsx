import { useFonts } from "expo-font";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from "@expo-google-fonts/ibm-plex-sans";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

import { trpc } from "@/utils/trpc";
import "../tamagui-web.css";
import { TamaguiProvider } from "@tamagui/core";
import tamaguiConfig from "../tamagui.config";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PortalProvider } from "tamagui";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { QueryClientProvider } from "@tanstack/react-query";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { persister, webNoPersist } from "@/utils/mmkv";
import { usePrivacy } from "@/utils/privacy";
import { authClient } from "@/utils/authClient";
import { apiOrigin } from "@/utils/api";
import { BiometricLock } from "@/components/biometric-lock";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const WEEK = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      // Recent data revalidates on view; older history stays served from the
      // on-device cache (and persists ~30 days on native — see persistOptions).
      staleTime: 1000 * 60 * 5,
      gcTime: WEEK * 4,
    },
  },
  queryCache: new QueryCache({
    onError(error) {
      if ("data" in error) {
        const data = error.data as { code: string };
        // Auth is handled by the route guards (index / Protected); don't force-redirect
        // here, or a missing hospital token would override the app-account picker.
        if (data.code === "UNAUTHORIZED") return;
        return Alert.alert("Error Occurred:", error.message);
      }
    },
  }),
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      fetch(url: any, options: any) {
        // Mobile networks stall sockets that never resolve or reject; without a ceiling a
        // hung request keeps a query in `isLoading` forever (endless spinner). Abort at 20s,
        // forwarding tRPC's own unmount-abort signal.
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        options?.signal?.addEventListener?.("abort", () => ctrl.abort());
        return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(t));
      },
      // Web: same-origin. Native: apiOrigin (prod gateway, or EXPO_PUBLIC_API_ORIGIN in dev).
      url:
        Platform.OS === "web"
          ? `${globalThis?.location?.origin ?? "-"}/api/trpc`
          : `${apiOrigin}/api/trpc`,

      // You can pass any HTTP headers you wish here
      async headers() {
        const token = await AsyncStorage.getItem("access:token");
        const h: Record<string, string> = { authorization: token ?? "no-token" };
        // Web sends the Better Auth session cookie automatically (same-origin).
        // Native has no cookie jar, so attach it from the Expo auth client.
        if (Platform.OS !== "web") {
          try {
            const cookie = authClient.getCookie();
            if (cookie) h.Cookie = cookie;
          } catch {}
        }
        return h;
      },
    }),
  ],
});

export default function RootLayout() {
  const [loaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Restore the saved "reveal PII" preference (defaults to hidden).
  useEffect(() => {
    usePrivacy.getState().hydrate();
  }, []);

  if (!loaded) {
    return null;
  }

  const app = (
    <TamaguiProvider config={tamaguiConfig}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <PortalProvider>
            <BiometricLock>
              <Stack screenOptions={{ headerShown: false }} />
            </BiometricLock>
          </PortalProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </TamaguiProvider>
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {webNoPersist || !persister ? (
        // Web: never persist clinical data — always fetch.
        <QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
      ) : (
        // Native: persist the cache to on-device SQLite (history kept ~30 days).
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: WEEK * 4 }}
        >
          {app}
        </PersistQueryClientProvider>
      )}
    </trpc.Provider>
  );
}
