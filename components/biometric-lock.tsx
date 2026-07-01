/**
 * Biometric app-lock gate (native only). Wraps the app: when the patient has enabled
 * biometric unlock AND a clinical session exists (access:token), the portal is hidden
 * behind a lock screen on cold start and whenever the app returns from the background.
 * Web renders children directly (no sensor — passkeys cover web).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fingerprint, Lock } from "@tamagui/lucide-icons";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

import { authenticateBiometric, isBiometricEnabled } from "@/utils/biometric";

type LockState = "checking" | "locked" | "open";

/** Should the app be protected right now? Only if the user opted in and has a session. */
async function shouldLock(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const [enabled, token] = await Promise.all([
    isBiometricEnabled(),
    AsyncStorage.getItem("access:token"),
  ]);
  return enabled && !!token;
}

function LockScreen({ onUnlock, attempting }: { onUnlock: () => void; attempting: boolean }) {
  return (
    <YStack flex={1} bg="$background" items="center" justify="center" gap="$5" p="$6">
      <YStack
        width={84}
        height={84}
        rounded={42}
        bg="$primarySoft"
        items="center"
        justify="center"
      >
        <Lock size={34} color="$primary" />
      </YStack>
      <YStack gap="$1.5" items="center">
        <Text fontSize={20} fontWeight="800" color="$color12">
          Portal locked
        </Text>
        <Text fontSize={14} color="$text2" text="center" maxW={280}>
          Unlock with your biometrics to view your health records.
        </Text>
      </YStack>
      <Button
        height={52}
        width="100%"
        maxW={320}
        rounded={14}
        bg="$primary"
        borderWidth={0}
        pressStyle={{ bg: "$primaryStrong" }}
        opacity={attempting ? 0.7 : 1}
        onPress={attempting ? undefined : onUnlock}
      >
        <XStack items="center" gap="$2.5">
          {attempting ? <Spinner color="$onPrimary" /> : <Fingerprint size={20} color="$onPrimary" />}
          <Text fontSize={16} fontWeight="700" color="$onPrimary">
            {attempting ? "Verifying…" : "Unlock"}
          </Text>
        </XStack>
      </Button>
    </YStack>
  );
}

export function BiometricLock({ children }: { children: React.ReactNode }) {
  // Web: no gate at all.
  if (Platform.OS === "web") return <>{children}</>;

  const [state, setState] = useState<LockState>("checking");
  const [attempting, setAttempting] = useState(false);
  const appState = useRef(AppState.currentState);

  const unlock = useCallback(async () => {
    setAttempting(true);
    try {
      const ok = await authenticateBiometric();
      if (ok) setState("open");
    } finally {
      setAttempting(false);
    }
  }, []);

  // Decide lock state on mount, then auto-prompt if locked.
  useEffect(() => {
    (async () => {
      try {
        if (await shouldLock()) {
          setState("locked");
          unlock();
        } else {
          setState("open");
        }
      } catch {
        // Fail open: the lock guards an already-persisted session, not our auth boundary.
        // If SecureStore errors we must not trap the user on the "checking" spinner forever.
        setState("open");
      }
    })();
  }, [unlock]);

  // Re-lock when the app comes back to the foreground from background/inactive.
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/inactive|background/) && next === "active") {
        if (await shouldLock()) {
          setState("locked");
          unlock();
        }
      }
    });
    return () => sub.remove();
  }, [unlock]);

  if (state === "checking") {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }
  if (state === "locked") return <LockScreen onUnlock={unlock} attempting={attempting} />;
  return <>{children}</>;
}
