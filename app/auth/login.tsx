import React from "react";
import { router } from "expo-router";
import {
  ArrowRight,
  Fingerprint,
  Hospital,
  KeyRound,
  Lock,
  Mail,
  ScanFace,
} from "@tamagui/lucide-icons";
import { Button, Text, XStack, YStack } from "tamagui";

import { AuthLayout } from "@/components/auth/layout";

/** A read-only, disabled field rendered for the not-yet-available app-account flow. */
function GhostField({ Icon, placeholder }: { Icon: any; placeholder: string }) {
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
      opacity={0.7}
    >
      <Icon size={18} color="$text3" />
      <Text fontSize={15} color="$text3">
        {placeholder}
      </Text>
    </XStack>
  );
}

/**
 * The future "app account" sign-in (email + password + biometrics). Present, on-brand,
 * and clearly marked Coming soon. The working way in is the hospital record below.
 */
function AppAccountComingSoon() {
  return (
    <YStack gap="$2.5" p="$3.5" rounded={16} borderWidth={1} borderColor="$border" bg="$surface">
      <XStack items="center" justify="space-between">
        <Text fontSize={13} fontWeight="700" color="$color12">
          Sign in with your app account
        </Text>
        <XStack items="center" gap="$1.5" bg="$primarySoft" px="$2" py="$1" rounded={20}>
          <Lock size={11} color="$primary" />
          <Text fontSize={10} fontWeight="700" color="$primary">
            COMING SOON
          </Text>
        </XStack>
      </XStack>
      <GhostField Icon={Mail} placeholder="you@example.com" />
      <GhostField Icon={Lock} placeholder="Password" />
      <XStack gap="$2.5" mt="$1">
        {[
          { Icon: ScanFace, label: "Face ID" },
          { Icon: Fingerprint, label: "Touch ID" },
          { Icon: KeyRound, label: "Passkey" },
        ].map((b) => (
          <YStack
            key={b.label}
            flex={1}
            height={58}
            rounded={14}
            borderWidth={1}
            borderColor="$border"
            bg="$surface2"
            items="center"
            justify="center"
            gap="$1.5"
            opacity={0.6}
          >
            <b.Icon size={20} color="$text3" />
            <Text fontSize={10.5} color="$text3" fontWeight="500">
              {b.label}
            </Text>
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
}

export default function SignIn() {
  return (
    <AuthLayout>
      <YStack gap="$1" items="center" mb="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Welcome back
        </Text>
        <Text fontSize={14} color="$text2" text="center">
          Sign in to view your health records.
        </Text>
      </YStack>

      <AppAccountComingSoon />

      <XStack items="center" gap="$3" my="$1">
        <YStack flex={1} height={1} bg="$border" />
        <Text fontSize={12} color="$text3" fontWeight="600">
          or
        </Text>
        <YStack flex={1} height={1} bg="$border" />
      </XStack>

      {/* The working way in today: a patient's hospital record. Own page. */}
      <Button
        height={54}
        rounded={14}
        bg="$primary"
        pressStyle={{ bg: "$primaryStrong", borderColor: "$primaryStrong" }}
        borderWidth={0}
        onPress={() => router.push("/auth/hospital")}
      >
        <XStack items="center" gap="$2.5">
          <Hospital size={19} color="$onPrimary" />
          <Text fontSize={16} fontWeight="700" color="$onPrimary">
            Sign in with your hospital record
          </Text>
          <ArrowRight size={18} color="$onPrimary" />
        </XStack>
      </Button>
      <Text fontSize={12} color="$text3" text="center" mt="$-1">
        Use your MRN or scan your visit-ticket sticker.
      </Text>
    </AuthLayout>
  );
}
