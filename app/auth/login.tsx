import { useState } from "react";
import { router } from "expo-router";
import {
  ArrowRight,
  Hospital,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  User,
  C,
} from "@/components/ui/icons";
import type { NamedExoticComponent } from "react";
import { Button, Input, Spinner, Text, HStack, VStack, Pressable } from "@/components/ui/gs";

import { AuthLayout } from "@/components/auth/layout";
import { authClient } from "@/utils/authClient";

function Field({
  Icon,
  ...props
}: { Icon: NamedExoticComponent<any> } & React.ComponentProps<typeof Input>) {
  return (
    <HStack className="h-[50px] rounded-[14px] border border-border bg-surface2 items-center px-[15px] gap-[10px]">
      <Icon size={18} color={C.text3} />
      <Input
        className="flex-1 text-[15px] text-fg"
        placeholderTextColor={C.text3}
        {...props}
      />
    </HStack>
  );
}

/** What the thin accounts layer stores — shown plainly so patients can trust it. */
function WhatWeStore() {
  return (
    <HStack className="gap-[10px] p-[12px] rounded-[12px] bg-primarySoft items-start">
      <ShieldCheck size={16} color={C.primary} style={{ marginTop: 2 }} />
      <VStack className="flex-1 gap-[2px]">
        <Text className="text-[12.5px] font-plex-bold text-primary">What we store</Text>
        <Text className="text-[11.5px] text-primary leading-[16px]">
          Only your email and the hospitals you link to your account. Your medical records stay in
          the hospital systems — we never copy them to our servers. You can remove a hospital anytime.
        </Text>
      </VStack>
    </HStack>
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

  return (
    <VStack className="gap-[10px] p-[15px] rounded-[16px] border border-border bg-surface">
      <Text className="text-[13px] font-plex-bold text-fg">
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

      {error ? <Text className="text-[12px] text-bad">{error}</Text> : null}

      {mode === "signup" ? <WhatWeStore /> : null}

      <Button
        variant="solid"
        onPress={busy ? undefined : submit}
        className={`h-[48px] rounded-[12px] ${busy ? "opacity-70" : ""}`}
      >
        {busy ? (
          <Spinner color={C.onPrimary} />
        ) : (
          <Text className="text-[15px] font-plex-bold text-onPrimary">
            {mode === "signup" ? "Create account" : "Sign in"}
          </Text>
        )}
      </Button>

      <HStack className="justify-center gap-[4px] pt-[1px]">
        <Text className="text-[12.5px] text-text2">
          {mode === "signup" ? "Already have an account?" : "New here?"}
        </Text>
        <Text
          className="text-[12.5px] font-plex-bold text-primary"
          onPress={() => {
            setError(null);
            setMode(mode === "signup" ? "signin" : "signup");
          }}
        >
          {mode === "signup" ? "Sign in" : "Create account"}
        </Text>
      </HStack>
    </VStack>
  );
}

export default function SignIn() {
  return (
    <AuthLayout>
      <VStack className="gap-[2px] items-center mb-[2px]">
        <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px]">Welcome</Text>
        <Text className="text-[14px] text-text2 text-center">
          Sign in to view your health records.
        </Text>
      </VStack>

      <AppAccount />

      <HStack className="items-center gap-[12px] my-[2px]">
        <VStack className="flex-1 h-[1px] bg-border" />
        <Text className="text-[12px] text-text3 font-plex-semibold">or</Text>
        <VStack className="flex-1 h-[1px] bg-border" />
      </HStack>

      {/* Direct hospital-record sign-in (no app account needed). */}
      <Button
        variant="outline"
        onPress={() => router.push("/auth/hospital")}
        className="h-[54px] rounded-[14px]"
      >
        <HStack className="items-center gap-[10px]">
          <Hospital size={19} color={C.primary} />
          <Text className="text-[15px] font-plex-bold text-primary">
            Sign in with a hospital record
          </Text>
          <ArrowRight size={18} color={C.primary} />
        </HStack>
      </Button>
      <Text className="text-[12px] text-text3 text-center mt-[-2px]">
        Use your MRN or scan your visit-ticket sticker.
      </Text>

      {/* Public, no-login: search doctors + bed availability across hospitals. */}
      <Pressable
        onPress={() => router.push("/explore" as any)}
        className="flex-row items-center justify-center gap-[7px] h-[48px] rounded-[14px] border border-border bg-surface mt-[2px] active:opacity-70"
      >
        <Search size={17} color={C.primary} />
        <Text className="text-[14px] font-plex-bold text-primary">Find a doctor or bed</Text>
      </Pressable>
    </AuthLayout>
  );
}
