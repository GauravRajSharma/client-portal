import { Platform } from "react-native";

/**
 * Origin of the app's own API (tRPC + /api/pacs image proxy). On web that's the page
 * origin; on native it must be an absolute host.
 *
 * Native default is the production gateway. For local device/emulator dev against a
 * laptop, set EXPO_PUBLIC_API_ORIGIN (e.g. http://192.168.x.x:8081) before `expo start`
 * — EXPO_PUBLIC_* values are inlined at build time.
 */
const PROD_NATIVE_ORIGIN = "https://mobile.ehrnepal.com";

export const apiOrigin: string = Platform.select({
  web: globalThis?.location?.origin ?? "",
  default: process.env.EXPO_PUBLIC_API_ORIGIN ?? PROD_NATIVE_ORIGIN,
}) as string;

/** Make a server-returned relative API path absolute (no-op if already absolute). */
export const toApiUrl = (path: string): string =>
  path.startsWith("http") ? path : `${apiOrigin}${path}`;
