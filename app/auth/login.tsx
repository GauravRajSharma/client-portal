import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  Fingerprint,
  Hospital,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  User,
} from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Button, Input, Spinner, Text, XStack, YStack } from "tamagui";

import { AuthLayout } from "@/components/auth/layout";
import { authClient } from "@/utils/authClient";

function Field({
  Icon,
  ...props
}: { Icon: NamedExoticComponent<any> } & React.ComponentProps<typeof Input>) {
  return (
    <XStack
      height={50}
      rounded={14}
      borderWidth={1}
      borderColor="$border"
      bg="$surface2"
      items="center"
      px="$3.5"
      gap="$2.5"
      focusWithinStyle={{ borderColor: "$primary" }}
    >
      <Icon size={18} color="$text3" />
      <Input
        unstyled
        flex={1}
        fontSize={15}
        color="$color12"
        placeholderTextColor="$text3"
        {...props}
      />
    </XStack>
  );
}

/** What the thin accounts layer stores — shown plainly so patients can trust it. */
function WhatWeStore() {
  return (
    <XStack gap="$2.5" p="$3" rounded={12} bg="$primarySoft" items="flex-start">
      <ShieldCheck size={16} color="$primary" style={{ marginTop: 2 }} />
      <YStack flex={1} gap="$1">
        <Text fontSize={12.5} fontWeight="700" color="$primary">
          What we store
        </Text>
        <Text fontSize={11.5} color="$primary" lineHeight={16}>
          Only your email and the hospitals you link to your account. Your medical records stay in
          the hospital systems — we never copy them to our servers. You can remove a hospital anytime.
        </Text>
      </YStack>
    </XStack>
  );
}

function AppAccount() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 8) {
      setError("Enter your email and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.trim() })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (res.error) {
        setError(res.error.message ?? "Something went wrong. Please try again.");
        return;
      }
      router.replace("/auth/hospitals" as any);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Web only: sign in with a registered passkey (WebAuthn — uses the browser's biometrics).
  // Resolved after mount (client-only) so it never trips SSR hydration, and only where
  // the browser actually supports WebAuthn.
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && (window as any).PublicKeyCredential) {
      setPasskeyAvailable(true);
    }
  }, []);
  const signInWithPasskey = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await (authClient as any).signIn.passkey();
      if (res?.error) {
        setError(res.error.message ?? "Couldn't sign in with a passkey.");
        return;
      }
      router.replace("/auth/hospitals" as any);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't sign in with a passkey.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack gap="$2.5" p="$3.5" rounded={16} borderWidth={1} borderColor="$border" bg="$surface">
      <Text fontSize={13} fontWeight="700" color="$color12">
        {mode === "signup" ? "Create your app account" : "Sign in with your app account"}
      </Text>

      {mode === "signup" ? <Field Icon={User} placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" /> : null}
      <Field
        Icon={Mail}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        Icon={Lock}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onSubmitEditing={submit}
      />

      {error ? (
        <Text fontSize={12} color="$bad">
          {error}
        </Text>
      ) : null}

      {mode === "signup" ? <WhatWeStore /> : null}

      <Button
        height={48}
        rounded={12}
        bg="$primary"
        borderWidth={0}
        pressStyle={{ bg: "$primaryStrong" }}
        opacity={busy ? 0.7 : 1}
        onPress={busy ? undefined : submit}
      >
        {busy ? (
          <Spinner color="$onPrimary" />
        ) : (
          <Text fontSize={15} fontWeight="700" color="$onPrimary">
            {mode === "signup" ? "Create account" : "Sign in"}
          </Text>
        )}
      </Button>

      {passkeyAvailable && mode === "signin" ? (
        <Button
          height={44}
          rounded={12}
          bg="$surface2"
          borderWidth={1}
          borderColor="$border"
          pressStyle={{ opacity: 0.8 }}
          onPress={busy ? undefined : signInWithPasskey}
        >
          <XStack items="center" gap="$2">
            <Fingerprint size={17} color="$primary" />
            <Text fontSize={13.5} fontWeight="700" color="$primary">
              Sign in with a passkey
            </Text>
          </XStack>
        </Button>
      ) : null}

      <XStack justify="center" gap="$1.5" pt="$0.5">
        <Text fontSize={12.5} color="$text2">
          {mode === "signup" ? "Already have an account?" : "New here?"}
        </Text>
        <Text
          fontSize={12.5}
          fontWeight="700"
          color="$primary"
          onPress={() => {
            setError(null);
            setMode(mode === "signup" ? "signin" : "signup");
          }}
        >
          {mode === "signup" ? "Sign in" : "Create account"}
        </Text>
      </XStack>
    </YStack>
  );
}

export default function SignIn() {
  return (
    <AuthLayout>
      <YStack gap="$1" items="center" mb="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Welcome
        </Text>
        <Text fontSize={14} color="$text2" text="center">
          Sign in to view your health records.
        </Text>
      </YStack>

      <AppAccount />

      <XStack items="center" gap="$3" my="$1">
        <YStack flex={1} height={1} bg="$border" />
        <Text fontSize={12} color="$text3" fontWeight="600">
          or
        </Text>
        <YStack flex={1} height={1} bg="$border" />
      </XStack>

      {/* Direct hospital-record sign-in (no app account needed). */}
      <Button
        height={54}
        rounded={14}
        bg="$surface"
        borderWidth={1}
        borderColor="$border"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => router.push("/auth/hospital")}
      >
        <XStack items="center" gap="$2.5">
          <Hospital size={19} color="$primary" />
          <Text fontSize={15} fontWeight="700" color="$primary">
            Sign in with a hospital record
          </Text>
          <ArrowRight size={18} color="$primary" />
        </XStack>
      </Button>
      <Text fontSize={12} color="$text3" text="center" mt="$-1">
        Use your MRN or scan your visit-ticket sticker.
      </Text>

      {/* Public, no-login: search doctors + bed availability across hospitals. */}
      <XStack
        items="center"
        justify="center"
        gap="$2"
        height={48}
        rounded={14}
        borderWidth={1}
        borderColor="$border"
        bg="$surface"
        mt="$1"
        onPress={() => router.push("/explore" as any)}
        pressStyle={{ opacity: 0.7 }}
      >
        <Search size={17} color="$primary" />
        <Text fontSize={14} fontWeight="700" color="$primary">
          Find a doctor or bed
        </Text>
      </XStack>
    </AuthLayout>
  );
}
