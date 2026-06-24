import type { ReactNode } from "react";
import { Activity, Eye, Lock, MapPin } from "@tamagui/lucide-icons";
import {
  Paragraph,
  ScrollView,
  Text,
  XStack,
  YStack,
  styled,
  useMedia,
} from "tamagui";

/** A native HTML <form> on web so the browser treats the inputs as a real form. */
export const FormStack = styled(YStack, {
  tag: "form",
  width: "100%",
  gap: "$3.5",
});

/** Deltalab brand block: white logo tile + name + place line. Centered. */
function AuthBrand() {
  return (
    <YStack items="center" gap="$3" mb="$4" mt="$2">
      <YStack
        width={104}
        height={104}
        rounded={28}
        bg="$surface"
        borderWidth={1}
        borderColor="$border"
        items="center"
        justify="center"
        shadowColor="rgba(16,36,61,0.18)"
        shadowRadius={28}
        shadowOffset={{ width: 0, height: 12 }}
      >
        <YStack
          width={62}
          height={62}
          rounded={18}
          bg="$primary"
          items="center"
          justify="center"
        >
          <Activity size={34} color="#fff" strokeWidth={2.4} />
        </YStack>
      </YStack>
      <YStack items="center" gap="$1.5">
        <Text fontSize={25} fontWeight="700" color="$color12" letterSpacing={-0.5}>
          EHRPlus
        </Text>
        <XStack items="center" gap="$1.5">
          <MapPin size={14} color="$primary" />
          <Text fontSize={13.5} fontWeight="600" color="$primary">
            WHO Nepal · Patient Portal
          </Text>
        </XStack>
      </YStack>
    </YStack>
  );
}

/** Trust footer: the load-bearing reassurance for health data. */
function AuthFooter() {
  return (
    <YStack gap="$2.5" pt="$3" mt="$2" borderTopWidth={1} borderColor="$border">
      <XStack items="center" gap="$2.5">
        <Eye size={15} color="$text3" />
        <Text fontSize={12.5} color="$text2" flex={1}>
          View-only access to your records. Nothing is changed.
        </Text>
      </XStack>
      <XStack items="center" gap="$2.5">
        <Lock size={15} color="$text3" />
        <Text fontSize={12.5} color="$text2" flex={1}>
          Your data stays private to you.
        </Text>
      </XStack>
    </YStack>
  );
}

/**
 * AuthLayout — Deltalab login chrome. Soft-blue background, centered brand, single
 * column. On web (>= md) the column sits in a calm white card with a max width.
 */
export const AuthLayout = ({ children }: { children: ReactNode }) => {
  const wide = useMedia().md;

  const inner = (
    <YStack width="100%" maxW={wide ? 420 : undefined} mx="auto" gap="$4">
      <AuthBrand />
      {children}
      <AuthFooter />
    </YStack>
  );

  if (wide) {
    return (
      <YStack flex={1} bg="$appBg" items="center" justify="center" p="$6">
        <YStack
          width="100%"
          maxW={476}
          rounded={28}
          bg="$surface"
          borderWidth={1}
          borderColor="$border"
          px="$7"
          py="$7"
          shadowColor="rgba(16,36,61,0.18)"
          shadowRadius={32}
          shadowOffset={{ width: 0, height: 16 }}
        >
          {inner}
        </YStack>
      </YStack>
    );
  }

  return (
    <ScrollView
      flex={1}
      bg="$appBg"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <YStack flex={1} px="$5" pt="$4" pb="$7">
        {inner}
      </YStack>
    </ScrollView>
  );
};
