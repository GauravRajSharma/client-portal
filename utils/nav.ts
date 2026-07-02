import { router } from "expo-router";

/**
 * Web-safe back. `router.back()` is a no-op on the web when there's no history
 * (direct load / deep link / after a `replace`), which makes back buttons look
 * broken. Fall back to an explicit parent route in that case.
 */
export function backOr(fallback: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as never);
}
