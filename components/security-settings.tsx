/**
 * Security section for the Profile screen.
 *  - Native: a Face ID / fingerprint toggle that gates re-opening the portal (biometric.ts).
 *  - Web: register a passkey (WebAuthn) for phishing-resistant, password-free sign-in.
 * Each platform only shows the control it can actually use.
 */
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Fingerprint, KeyRound } from "@tamagui/lucide-icons";
import { Button, Spinner, Switch, Text, XStack, YStack } from "tamagui";

import { Panel, Section } from "@/components/ui";
import { authClient } from "@/utils/authClient";
import {
  disableBiometric,
  enableBiometric,
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
} from "@/utils/biometric";

function BiometricRow() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("biometrics");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await isBiometricAvailable();
      setAvailable(avail);
      if (avail) {
        setEnabled(await isBiometricEnabled());
        setLabel(await getBiometricLabel());
      }
    })();
  }, []);

  if (!available) return null;

  const toggle = async (next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        if (await enableBiometric()) setEnabled(true);
      } else {
        await disableBiometric();
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <XStack items="center" gap="$3" px="$4" py="$3.5">
      <YStack width={38} height={38} rounded={10} bg="$primarySoft" items="center" justify="center">
        <Fingerprint size={18} color="$primary" />
      </YStack>
      <YStack flex={1} gap="$0.5">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Unlock with {label}
        </Text>
        <Text fontSize="$2" color="$color9">
          Require {label} each time you open the portal.
        </Text>
      </YStack>
      {busy ? (
        <Spinner color="$primary" />
      ) : (
        <Switch
          size="$3"
          checked={enabled}
          onCheckedChange={toggle}
          bg={enabled ? "$primary" : "$surface2"}
          borderColor="$border"
        >
          <Switch.Thumb animation="quick" bg="white" />
        </Switch>
      )}
    </XStack>
  );
}

function PasskeyRow() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const add = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await (authClient as any).passkey?.addPasskey?.({ name: "This device" });
      if (res?.error) {
        setMsg({ ok: false, text: res.error.message ?? "Couldn't add a passkey." });
      } else {
        setMsg({ ok: true, text: "Passkey added. You can now sign in without a password." });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Couldn't add a passkey." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack px="$4" py="$3.5" gap="$2.5">
      <XStack items="center" gap="$3">
        <YStack width={38} height={38} rounded={10} bg="$primarySoft" items="center" justify="center">
          <KeyRound size={18} color="$primary" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Passkey
          </Text>
          <Text fontSize="$2" color="$color9">
            Sign in with Face ID, fingerprint, or your device PIN, no password.
          </Text>
        </YStack>
        <Button
          size="$3"
          rounded={10}
          bg="$primary"
          borderWidth={0}
          pressStyle={{ bg: "$primaryStrong" }}
          opacity={busy ? 0.7 : 1}
          onPress={busy ? undefined : add}
        >
          {busy ? (
            <Spinner color="$onPrimary" />
          ) : (
            <Text fontSize={13} fontWeight="700" color="$onPrimary">
              Add
            </Text>
          )}
        </Button>
      </XStack>
      {msg ? (
        <Text fontSize="$2" color={msg.ok ? "$primary" : "$bad"}>
          {msg.text}
        </Text>
      ) : null}
    </YStack>
  );
}

export function SecuritySettings() {
  const content = Platform.OS === "web" ? <PasskeyRow /> : <BiometricRow />;
  return (
    <Section title="Security">
      <Panel p="$0" gap="$0">
        {content}
      </Panel>
    </Section>
  );
}
