/**
 * Better Auth client for the thin accounts layer (email + password).
 * - Web: cookie-based session (same-origin), no Expo plugin.
 * - Native: Expo plugin stores the session in the OS keychain (SecureStore) and we
 *   attach its cookie to API requests manually (see app/_layout.tsx).
 */
import { Platform } from "react-native";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { apiOrigin } from "./api";

export const authClient = createAuthClient({
  baseURL: apiOrigin,
  plugins:
    Platform.OS === "web"
      ? []
      : [expoClient({ scheme: "ehrplus", storagePrefix: "ehrplus", storage: SecureStore })],
});
