import { type TKey, useT } from "@/utils/i18n";
import {
  Activity,
  FlaskConical,
  LayoutGrid,
  Pill,
  Plus,
  Stethoscope,
  User,
} from "@tamagui/lucide-icons";
import { router, useGlobalSearchParams, usePathname } from "expo-router";
import type { NamedExoticComponent, ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Theme, XStack, YStack, useMedia } from "tamagui";

interface NavItem {
  key: string; // route suffix under /patient/[uuid]/
  labelKey: TKey; // localized label (see utils/i18n)
  Icon: NamedExoticComponent<any>;
}

// Primary IA. Billing/documents are reached from Home and Profile to keep the bar to 5.
const NAV: NavItem[] = [
  { key: "home", labelKey: "nav.home", Icon: LayoutGrid },
  { key: "visits", labelKey: "nav.visits", Icon: Stethoscope },
  { key: "results", labelKey: "nav.results", Icon: FlaskConical },
  { key: "meds", labelKey: "nav.meds", Icon: Pill },
  { key: "profile", labelKey: "nav.profile", Icon: User },
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
  label,
  active,
  onPress,
}: {
  item: NavItem;
  label: string;
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
      bg={active ? "$primarySoft" : "transparent"}
      hoverStyle={{ bg: active ? "$primarySoft" : "$surface2" }}
      pressStyle={{ opacity: 0.7 }}
      animation="quick"
      onPress={onPress}
      cursor="pointer"
    >
      <item.Icon size={20} color={active ? "$primary" : "$text2"} />
      <Text
        fontSize="$4"
        fontWeight={active ? "700" : "500"}
        color={active ? "$color12" : "$color11"}
      >
        {label}
      </Text>
    </XStack>
  );
}

/** Bottom tab (mobile). */
function Tab({
  item,
  label,
  active,
  onPress,
}: {
  item: NavItem;
  label: string;
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
      <item.Icon size={22} color={active ? "$primary" : "$text3"} />
      <Text
        fontSize={11}
        fontWeight={active ? "700" : "500"}
        color={active ? "$primary" : "$text3"}
        numberOfLines={1}
      >
        {label}
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
  const T = useT();
  const { uuid } = useGlobalSearchParams<{ uuid: string }>();
  const patientUuid = uuid ?? "";

  if (media.md) {
    return (
      <XStack flex={1} bg="$appBg">
        <YStack
          width={252}
          bg="$surface"
          borderRightWidth={1}
          borderColor="$border"
          px="$3"
          py="$4"
          gap="$1"
        >
          <XStack items="center" gap="$2.5" px="$3" pb="$4">
            <YStack width={30} height={30} rounded="$4" bg="$primary" items="center" justify="center">
              <Activity size={18} color="#fff" />
            </YStack>
            <Text fontSize="$5" fontWeight="800" color="$color12">
              EHRPlus
            </Text>
          </XStack>
          {NAV.map((item) => (
            <SideItem
              key={item.key}
              item={item}
              label={T(item.labelKey)}
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
    <YStack flex={1} bg="$appBg">
      <YStack flex={1}>{children}</YStack>

      {/* Add result — designed, alpha-gated. */}
      <YStack
        position="absolute"
        r={18}
        b={insets.bottom + 78}
        width={54}
        height={54}
        rounded={27}
        bg="$primary"
        items="center"
        justify="center"
        z={60}
        shadowColor="rgba(11,78,160,0.4)"
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
        pressStyle={{ bg: "$primaryStrong", scale: 0.96 }}
        onPress={() => router.push(`/patient/${patientUuid}/add` as any)}
      >
        <Plus size={26} color="$onPrimary" />
      </YStack>

      <XStack
        bg="$surface"
        borderTopWidth={1}
        borderColor="$border"
        pb={insets.bottom}
        px="$1"
      >
        {NAV.map((item) => (
          <Tab
            key={item.key}
            item={item}
            label={T(item.labelKey)}
            active={item.key === active}
            onPress={() => go(patientUuid, item.key)}
          />
        ))}
      </XStack>
    </YStack>
  );
}
