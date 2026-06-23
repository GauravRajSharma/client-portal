import type { ReactNode } from "react";
import { BadgeCheck, Eye, Lock, ShieldCheck } from "@tamagui/lucide-icons";
import {
  H1,
  Paragraph,
  ScrollView,
  Text,
  Theme,
  XStack,
  YStack,
  styled,
  useMedia,
} from "tamagui";
import type { MediaQueryKey } from "@tamagui/web";

/**
 * Render children only when the given media query is NOT active.
 * Kept for backwards compatibility with earlier call sites.
 */
export const Hide = ({
  children,
  when = "sm",
}: {
  children: ReactNode;
  when?: MediaQueryKey;
}) => {
  const hide = useMedia()[when];
  if (hide) return null;
  return <>{children}</>;
};

/** A native HTML <form> on web so the browser treats the inputs as a real form. */
export const FormStack = styled(YStack, {
  tag: "form",
  width: "100%",
  gap: "$3.5",
});

/** A single quiet trust cue: small icon + plain-language line. */
function TrustCue({
  Icon,
  children,
}: {
  Icon: typeof Lock;
  children: ReactNode;
}) {
  return (
    <XStack items="center" gap="$2.5">
      <Icon size={16} color="$color10" />
      <Text fontSize="$3" color="$color11" flex={1}>
        {children}
      </Text>
    </XStack>
  );
}

/**
 * AuthAside — the brand / reassurance panel shown beside the form on web (>= md).
 * Quietly Nepali, calm, clinical. Carries the trust cues that matter for health data.
 */
function AuthAside() {
  return (
    <Theme name="accent">
      <YStack
        flex={1}
        minW={320}
        maxW={440}
        bg="$color5"
        p="$8"
        gap="$7"
        justify="space-between"
      >
        <XStack items="center" gap="$2.5">
          <YStack
            width={36}
            height={36}
            rounded="$4"
            bg="$color1"
            items="center"
            justify="center"
          >
            <ShieldCheck size={20} color="$color9" />
          </YStack>
          <YStack>
            <Text fontSize="$5" fontWeight="800" color="$color1">
              EHRPlus
            </Text>
            <Text fontSize="$1" color="$color2" letterSpacing={0.4}>
              WHO Nepal Patient Portal
            </Text>
          </YStack>
        </XStack>

        <YStack gap="$3" maxW={340}>
          <H1 size="$9" lineHeight="$8" color="$color1" fontWeight="800">
            Your health record, in your hands
          </H1>
          <Paragraph fontSize="$4" color="$color2" lineHeight="$5">
            View your visits, lab results, medicines, and bills from your
            hospital. Private, and yours alone.
          </Paragraph>
        </YStack>

        <YStack gap="$3.5">
          <AsideCue Icon={Eye} text="View-only access to your records" />
          <AsideCue Icon={Lock} text="Encrypted and private to you" />
          <AsideCue Icon={BadgeCheck} text="Verified against your hospital" />
        </YStack>
      </YStack>
    </Theme>
  );
}

function AsideCue({ Icon, text }: { Icon: typeof Lock; text: string }) {
  return (
    <XStack items="center" gap="$3">
      <Icon size={18} color="$color2" />
      <Text fontSize="$3" color="$color1" fontWeight="600">
        {text}
      </Text>
    </XStack>
  );
}

/** Compact brand mark for the top of the mobile / narrow form column. */
function AuthBrandRow() {
  return (
    <XStack items="center" gap="$2.5" mb="$2">
      <Theme name="accent">
        <YStack
          width={36}
          height={36}
          rounded="$4"
          bg="$color5"
          items="center"
          justify="center"
        >
          <ShieldCheck size={20} color="$color1" />
        </YStack>
      </Theme>
      <YStack>
        <Text fontSize="$5" fontWeight="800" color="$color12">
          EHRPlus
        </Text>
        <Text fontSize="$1" color="$color10" letterSpacing={0.4}>
          WHO Nepal Patient Portal
        </Text>
      </YStack>
    </XStack>
  );
}

/**
 * AuthLayout — premium responsive auth shell.
 *
 * - Mobile / narrow: a comfortable full-width single column. Compact brand mark on
 *   top, the form, and a quiet view-only trust line at the foot.
 * - Web (>= md): the form sits in a calm bordered card with a max width, centered
 *   in the viewport, with a reassurance aside panel to its left.
 *
 * Light theme throughout (Clinical Slate). No glassmorphism, no gradients.
 */
export const AuthLayout = ({ children }: { children: ReactNode }) => {
  const media = useMedia();
  const wide = media.md;

  if (wide) {
    return (
      <YStack flex={1} bg="$color2" items="center" justify="center" p="$6">
        <XStack
          width="100%"
          maxW={940}
          minH={560}
          rounded="$8"
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
          bg="$color1"
          shadowColor="$shadowColor"
          shadowRadius={24}
          shadowOffset={{ width: 0, height: 12 }}
        >
          <AuthAside />
          <YStack flex={1} minW={360} p="$8" justify="center">
            <YStack width="100%" maxW={400} mx="auto" gap="$5">
              {children}
              <AuthFooter />
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    );
  }

  return (
    <ScrollView
      flex={1}
      bg="$background"
      contentContainerStyle={{ minH: "100%" }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <YStack flex={1} px="$4" pt="$7" pb="$6" gap="$5" justify="space-between">
        <YStack gap="$5">
          <AuthBrandRow />
          {children}
        </YStack>
        <AuthFooter />
      </YStack>
    </ScrollView>
  );
};

/** Trust footer shared by both layouts. The single load-bearing reassurance. */
function AuthFooter() {
  return (
    <YStack gap="$2.5" pt="$2" borderTopWidth={1} borderColor="$borderColor">
      <TrustCue Icon={Eye}>View-only access to your records. Nothing is changed.</TrustCue>
      <TrustCue Icon={Lock}>Your data stays private to you.</TrustCue>
    </YStack>
  );
}
