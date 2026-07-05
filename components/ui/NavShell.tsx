import { type TKey, useT } from "@/utils/i18n";
import {
  Activity,
  FlaskConical,
  LayoutGrid,
  Pill,
  Plus,
  Stethoscope,
  User,
  C,
} from "@/components/ui/icons";
import { router, useGlobalSearchParams, usePathname } from "expo-router";
import type { ComponentType, ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HStack, VStack, Text, Pressable, useMedia } from "./gs";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");
type IconC = ComponentType<{ size?: number; color?: string }>;

interface NavItem {
  key: string; // route suffix under /patient/[uuid]/
  labelKey: TKey; // localized label (see utils/i18n)
  Icon: IconC;
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
function SideItem({ item, label, active, onPress }: { item: NavItem; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cx("flex-row items-center gap-[12px] px-[12px] py-[10px] rounded-[9px] active:opacity-70", active ? "bg-primarySoft" : "bg-transparent")}
    >
      <item.Icon size={20} color={active ? C.primary : C.text2} />
      <Text className={cx("text-[16px]", active ? "font-plex-bold text-fg" : "font-plex-medium text-fg")}>{label}</Text>
    </Pressable>
  );
}

/** Bottom tab (mobile). */
function Tab({ item, label, active, onPress }: { item: NavItem; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center gap-[2px] py-[7px] active:opacity-60">
      <item.Icon size={22} color={active ? C.primary : C.text3} />
      <Text className={cx("text-[11px]", active ? "font-plex-bold text-primary" : "font-plex-medium text-text3")} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * NavShell — responsive app frame. Web (`md`): persistent left sidebar + content.
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
      <HStack className="flex-1 bg-appBg">
        <VStack className="w-[252px] bg-surface border-r border-border px-[12px] py-[17px] gap-[2px]">
          <HStack className="items-center gap-[10px] px-[12px] pb-[17px]">
            <VStack className="w-[30px] h-[30px] rounded-[9px] bg-primary items-center justify-center">
              <Activity size={18} color="#fff" />
            </VStack>
            <Text className="text-[17px] font-plex-bold text-fg">EHRPlus</Text>
          </HStack>
          {NAV.map((item) => (
            <SideItem key={item.key} item={item} label={T(item.labelKey)} active={item.key === active} onPress={() => go(patientUuid, item.key)} />
          ))}
        </VStack>
        <VStack className="flex-1">{children}</VStack>
      </HStack>
    );
  }

  return (
    <VStack className="flex-1 bg-appBg">
      <VStack className="flex-1">{children}</VStack>

      {/* Add result — designed, alpha-gated. */}
      <Pressable
        onPress={() => router.push(`/patient/${patientUuid}/add` as any)}
        className="absolute right-[18px] w-[54px] h-[54px] rounded-full bg-primary items-center justify-center z-[60] active:scale-95 active:bg-primaryStrong"
        style={{ bottom: insets.bottom + 78, shadowColor: "rgba(11,78,160,0.4)", shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        <Plus size={26} color={C.onPrimary} />
      </Pressable>

      <HStack className="bg-surface border-t border-border px-[2px]" style={{ paddingBottom: insets.bottom }}>
        {NAV.map((item) => (
          <Tab key={item.key} item={item} label={T(item.labelKey)} active={item.key === active} onPress={() => go(patientUuid, item.key)} />
        ))}
      </HStack>
    </VStack>
  );
}
