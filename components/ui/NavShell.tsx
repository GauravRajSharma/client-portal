import type { NamedExoticComponent, ReactNode } from "react";
import {
  Activity,
  FlaskConical,
  LayoutGrid,
  Pill,
  Stethoscope,
  User,
} from "@tamagui/lucide-icons";
import { router, usePathname, useGlobalSearchParams } from "expo-router";
import { Text, Theme, XStack, YStack, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NavItem {
  key: string; // route suffix under /patient/[uuid]/
  label: string;
  Icon: NamedExoticComponent<any>;
}

// Primary IA. Billing/documents are reached from Home and Profile to keep the bar to 5.
const NAV: NavItem[] = [
  { key: "home", label: "Home", Icon: LayoutGrid },
  { key: "visits", label: "Visits", Icon: Stethoscope },
  { key: "results", label: "Results", Icon: FlaskConical },
  { key: "meds", label: "Medicines", Icon: Pill },
  { key: "profile", label: "Profile", Icon: User },
];

function useActiveKey() {
  const pathname = usePathname();
  const seg = pathname.split("/").filter(Boolean).pop() ?? "home";
  return NAV.some((n) => n.key === seg) ? seg : "home";
}

function go(uuid: string, key: string) {
  router.replace(`/patient/${uuid}/${key}` as any);
}

/** Sidebar nav item (web). */
function SideItem({
  item,
  active,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <XStack
      items="center"
      gap="$3"
      px="$3"
      py="$2.5"
      rounded="$4"
      bg={active ? "$color3" : "transparent"}
      hoverStyle={{ bg: active ? "$color3" : "$color2" }}
      pressStyle={{ opacity: 0.7 }}
      animation="quick"
      onPress={onPress}
      cursor="pointer"
    >
      <item.Icon size={20} color={active ? "$accent9" : "$color10"} />
      <Text fontSize="$4" fontWeight={active ? "700" : "500"} color={active ? "$color12" : "$color11"}>
        {item.label}
      </Text>
    </XStack>
  );
}

/** Bottom tab (mobile). */
function Tab({
  item,
  active,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      gap="$1"
      py="$2"
      onPress={onPress}
      pressStyle={{ opacity: 0.6 }}
    >
      <item.Icon size={22} color={active ? "$accent9" : "$color9"} />
      <Text fontSize={11} fontWeight={active ? "700" : "500"} color={active ? "$accent9" : "$color9"}>
        {item.label}
      </Text>
    </YStack>
  );
}

/**
 * NavShell — responsive app frame. Web (`gtSm`): persistent left sidebar + content.
 * Mobile: content + fixed bottom tab bar. Wrap the routed screen as children.
 */
export function NavShell({ children }: { children: ReactNode }) {
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const active = useActiveKey();
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const patientUuid = uuid ?? "";

  if (media.md) {
    return (
      <XStack flex={1} bg="$background">
        <YStack
          width={252}
          bg="$color1"
          borderRightWidth={1}
          borderColor="$borderColor"
          px="$3"
          py="$4"
          gap="$1"
        >
          <XStack items="center" gap="$2.5" px="$3" pb="$4">
            <Theme name="accent">
              <YStack width={30} height={30} rounded="$4" bg="$accent9" items="center" justify="center">
                <Activity size={18} color="#fff" />
              </YStack>
            </Theme>
            <Text fontSize="$5" fontWeight="800" color="$color12">
              EHRPlus
            </Text>
          </XStack>
          {NAV.map((item) => (
            <SideItem
              key={item.key}
              item={item}
              active={item.key === active}
              onPress={() => go(patientUuid, item.key)}
            />
          ))}
        </YStack>
        <YStack flex={1}>{children}</YStack>
      </XStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <YStack flex={1}>{children}</YStack>
      <XStack
        bg="$color1"
        borderTopWidth={1}
        borderColor="$borderColor"
        pb={insets.bottom}
        px="$1"
      >
        {NAV.map((item) => (
          <Tab
            key={item.key}
            item={item}
            active={item.key === active}
            onPress={() => go(patientUuid, item.key)}
          />
        ))}
      </XStack>
    </YStack>
  );
}
