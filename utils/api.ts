import { Platform } from "react-native";

/**
 * Origin of the app's own API (tRPC + /api/pacs image proxy). On web that's the page
 * origin; on native it must be an absolute host (same one the tRPC client targets).
 */
export const apiOrigin: string = Platform.select({
  web: globalThis?.location?.origin ?? "",
  default: "http://192.168.250.118:8081",
}) as string;

/** Make a server-returned relative API path absolute (no-op if already absolute). */
export const toApiUrl = (path: string): string =>
  path.startsWith("http") ? path : `${apiOrigin}${path}`;
