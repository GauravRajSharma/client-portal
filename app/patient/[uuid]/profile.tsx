import {
  Avatar,
  ErrorState,
  LanguageToggle,
  Panel,
  PiiValue,
  PrivacyToggle,
  Screen,
  Section,
  Skeleton,
} from "@/components/ui";
import { HStack, VStack, Text, Pressable, Paragraph, Button, useMedia } from "@/components/ui/gs";
import type { PiiKind } from "@/utils/privacy";
import { useLang, useT } from "@/utils/i18n";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/utils/authClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Building2,
  ChevronRight,
  FlaskConical,
  Hospital as HospitalIcon,
  IdCard,
  LogOut,
  Phone,
  ShieldCheck,
  ShieldHalf,
  C,
} from "@/components/ui/icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { NamedExoticComponent } from "react";
import { Alert } from "react-native";

/** A single labelled detail line: muted label above, strong value below. */
function DetailRow({
  Icon,
  label,
  value,
  placeholder,
  pii,
}: {
  Icon: NamedExoticComponent<any>;
  label: string;
  value?: string;
  placeholder: string;
  pii?: PiiKind;
}) {
  const has = !!value && value.trim().length > 0;
  return (
    <HStack className="gap-[12px] items-start py-[10px]">
      <VStack className="mt-[2px]">
        <Icon size={18} color={C.text3} />
      </VStack>
      <VStack className="gap-[1px] flex-1">
        <Text className="text-[12px] text-text3 font-plex-semibold">
          {label}
        </Text>
        {pii && has ? (
          <PiiValue value={value} kind={pii} className="text-[17px] font-plex-bold text-fg" />
        ) : (
          <Text
            className={`text-[16px] ${has ? "font-plex-bold text-fg" : "font-plex-medium text-text3"}`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {has ? value : placeholder}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

/** Sign-out is gated behind a confirm dialog so it is never an accidental tap. */
function SignOutButton() {
  const T = useT();
  const queryClient = useQueryClient();

  const signOut = async () => {
    // End the app-account session too, else the route guard (see index.tsx) sees a
    // live Better Auth session and bounces back to /auth/hospitals — looking like
    // sign-out did nothing. Best-effort; local clear + redirect happen regardless.
    try {
      await authClient.signOut();
    } catch {}
    await AsyncStorage.removeItem("access:token");
    queryClient.clear();
    router.replace("/auth/login");
  };

  const confirmSignOut = () => {
    Alert.alert(T("profile.signOut.confirm"), T("profile.signOut.detail"), [
      { text: T("profile.signOut.cancel"), style: "cancel" },
      { text: T("profile.signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <Button variant="outline" icon={LogOut} onPress={confirmSignOut} className="self-start">
      {T("profile.signOut")}
    </Button>
  );
}

function ProfileSkeleton() {
  return (
    <VStack className="gap-[17px]">
      <Panel className="gap-[12px]">
        <HStack className="gap-[12px] items-center">
          <Skeleton className="w-[56px] h-[56px] rounded-full" />
          <VStack className="gap-[7px] flex-1">
            <Skeleton className="w-[55%] h-[18px]" />
            <Skeleton className="w-[35%] h-[12px]" />
          </VStack>
        </HStack>
      </Panel>
      <Panel className="gap-[10px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <VStack key={i} className="gap-[7px] py-[7px]">
            <Skeleton className="w-[30%] h-[11px]" />
            <Skeleton className="w-[60%] h-[16px]" />
          </VStack>
        ))}
      </Panel>
    </VStack>
  );
}

export default function Profile() {
  const T = useT();
  const { ready } = useLang();
  const media = useMedia();
  const { data, isLoading, isError, refetch } = trpc.patient.useQuery();

  // Hold the first paint until the saved language has hydrated, so a patient who
  // chose Nepali never sees an English flash on a cold start.
  if (isLoading || !ready) {
    return (
      <Screen>
        <Section title={T("profile.title")}>
          <ProfileSkeleton />
        </Section>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ErrorState
          title={T("state.error.title")}
          detail={T("state.error.detail")}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const placeholder = T("profile.notProvided");

  // Identity card: name + the two facts that answer "is this record mine?" (MRN and
  // facility) sit together, directly under the name. Calm, no chrome competing.
  const identityCard = (
    <Panel className="gap-[17px]">
      <HStack className="gap-[12px] items-center">
        <Avatar name={data.name} size={56} />
        <VStack className="gap-[2px] flex-1">
          <Text className="text-[20px] font-plex-bold text-fg" numberOfLines={2}>
            {data.name || placeholder}
          </Text>
          <HStack className="gap-[4px] items-center">
            <IdCard size={14} color={C.text3} />
            <PiiValue value={data.mrn} kind="mrn" className="text-[13px] font-plex-semibold text-text3" />
          </HStack>
          {data.hospital?.name ? (
            <HStack className="gap-[4px] items-center">
              <HospitalIcon size={14} color={C.text3} />
              <Text className="text-[13px] text-text3" numberOfLines={1}>
                {data.hospital.name}
              </Text>
            </HStack>
          ) : null}
        </VStack>
      </HStack>

      <VStack className="h-[1px] bg-border" />

      {/* Trust note: states the read-only invariant plainly. Not a tappable row. */}
      <HStack className="gap-[10px] items-start">
        <VStack className="mt-[1px]">
          <ShieldCheck size={18} color={C.primary} />
        </VStack>
        <VStack className="gap-[1px] flex-1">
          <Text className="text-[13px] font-plex-bold text-fg">
            {T("profile.viewOnly.title")}
          </Text>
          <Paragraph className="text-[12px] text-text3 leading-[18px]">
            {T("profile.viewOnly.detail")}
          </Paragraph>
        </VStack>
      </HStack>
    </Panel>
  );

  // Contact + coverage details. MRN and facility intentionally live in the identity
  // card above (the "is this me?" fields), so they are not repeated here.
  const details = (
    <Section title={T("profile.details")}>
      <Panel className="py-[7px]">
        <DetailRow
          Icon={ShieldHalf}
          label={T("profile.field.insurance")}
          value={data.insuranceNumber}
          placeholder={placeholder}
          pii="id"
        />
        <VStack className="h-[1px] bg-border" />
        <DetailRow
          Icon={Phone}
          label={T("profile.field.phone")}
          value={data.phone}
          placeholder={placeholder}
          pii="phone"
        />
      </Panel>
    </Section>
  );

  return (
    <Screen>
      <HStack className="items-center justify-between gap-[12px]">
        <Text className="text-[23px] font-plex-bold text-fg">
          {T("profile.title")}
        </Text>
        <HStack className="items-center gap-[7px]">
          <PrivacyToggle />
          <LanguageToggle />
        </HStack>
      </HStack>

      {media.md ? (
        <HStack className="gap-[23px] items-start">
          <VStack className="flex-[3]">{identityCard}</VStack>
          <VStack className="flex-[2]">{details}</VStack>
        </HStack>
      ) : (
        <VStack className="gap-[17px]">
          {identityCard}
          {details}
        </VStack>
      )}

      <Section title="More">
        <Panel className="p-0 gap-0">
          {[
            { Icon: ShieldCheck, label: "Health passport", to: "passport" },
            { Icon: FlaskConical, label: "Book a test", to: "book" },
            { Icon: Building2, label: "My Hospitals & Labs", to: "hospitals" },
          ].map((item, i) => (
            <Pressable
              key={item.to}
              onPress={() => router.push(`/patient/${data.id}/${item.to}` as any)}
              className={`flex-row items-center gap-[12px] px-[17px] py-[15px] active:opacity-60 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <VStack className="w-[38px] h-[38px] rounded-[10px] bg-primarySoft items-center justify-center">
                <item.Icon size={18} color={C.primary} />
              </VStack>
              <Text className="flex-1 text-[14px] font-plex-semibold text-fg">
                {item.label}
              </Text>
              <ChevronRight size={18} color={C.text3} />
            </Pressable>
          ))}
        </Panel>
      </Section>

      <VStack className="h-[1px] bg-border my-[7px]" />
      <SignOutButton />
    </Screen>
  );
}
