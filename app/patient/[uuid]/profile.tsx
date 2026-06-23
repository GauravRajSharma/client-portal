import {
  Avatar,
  ErrorState,
  LanguageToggle,
  Panel,
  Screen,
  Section,
  Skeleton,
} from "@/components/ui";
import { useLang, useT } from "@/utils/i18n";
import { trpc } from "@/utils/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Hospital as HospitalIcon,
  IdCard,
  LogOut,
  Phone,
  ShieldCheck,
  ShieldHalf,
} from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { NamedExoticComponent } from "react";
import {
  AlertDialog,
  Button,
  Paragraph,
  Separator,
  Text,
  Theme,
  XStack,
  YStack,
  useMedia,
} from "tamagui";

/** A single labelled detail line: muted label above, strong value below. */
function DetailRow({
  Icon,
  label,
  value,
  placeholder,
}: {
  Icon: NamedExoticComponent<any>;
  label: string;
  value?: string;
  placeholder: string;
}) {
  const has = !!value && value.trim().length > 0;
  return (
    <XStack gap="$3" items="flex-start" py="$2.5">
      <YStack mt="$1">
        <Icon size={18} color="$color10" />
      </YStack>
      <YStack gap="$0.5" flex={1}>
        <Text fontSize="$2" color="$color9" fontWeight="600">
          {label}
        </Text>
        <Text
          fontSize="$5"
          fontWeight={has ? "700" : "500"}
          color={has ? "$color12" : "$color9"}
          fontVariant={["tabular-nums"]}
        >
          {has ? value : placeholder}
        </Text>
      </YStack>
    </XStack>
  );
}

/** Sign-out is gated behind a confirm dialog so it is never an accidental tap. */
function SignOutButton() {
  const T = useT();
  const queryClient = useQueryClient();

  const signOut = async () => {
    // Local-only: clears the stored token + cached reads. NOT a backend mutation.
    await AsyncStorage.removeItem("access:token");
    queryClient.clear();
    router.replace("/auth/login");
  };

  return (
    <AlertDialog>
      <AlertDialog.Trigger asChild>
        <Button
          size="$4"
          chromeless
          icon={LogOut}
          color="$color11"
          borderColor="$borderColor"
          borderWidth={1}
          self="flex-start"
          pressStyle={{ opacity: 0.7 }}
        >
          {T("profile.signOut")}
        </Button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <AlertDialog.Content
          bordered
          elevate
          key="content"
          animation={["quick", { opacity: { overshootClamping: true } }]}
          enterStyle={{ x: 0, y: -12, opacity: 0, scale: 0.96 }}
          exitStyle={{ x: 0, y: 8, opacity: 0, scale: 0.97 }}
          gap="$3"
          maxW={400}
          width="90%"
        >
          <AlertDialog.Title fontSize="$6" fontWeight="800">
            {T("profile.signOut.confirm")}
          </AlertDialog.Title>
          <AlertDialog.Description fontSize="$3" color="$color10">
            {T("profile.signOut.detail")}
          </AlertDialog.Description>
          <XStack gap="$3" justify="flex-end" pt="$2">
            <AlertDialog.Cancel asChild>
              <Button size="$3" chromeless>
                {T("profile.signOut.cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild onPress={signOut}>
              <Theme name="error">
                <Button size="$3" icon={LogOut}>
                  {T("profile.signOut")}
                </Button>
              </Theme>
            </AlertDialog.Action>
          </XStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
}

function ProfileSkeleton() {
  return (
    <YStack gap="$4">
      <Panel gap="$3">
        <XStack gap="$3" items="center">
          <Skeleton width={56} height={56} rounded="$10" />
          <YStack gap="$2" flex={1}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={12} />
          </YStack>
        </XStack>
      </Panel>
      <Panel gap="$2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <YStack key={i} gap="$2" py="$2">
            <Skeleton width="30%" height={11} />
            <Skeleton width="60%" height={16} />
          </YStack>
        ))}
      </Panel>
    </YStack>
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
    <Panel gap="$4">
      <XStack gap="$3" items="center">
        <Avatar name={data.name} size={56} />
        <YStack gap="$1" flex={1}>
          <Text
            fontSize="$7"
            fontWeight="800"
            color="$color12"
            numberOfLines={2}
          >
            {data.name || placeholder}
          </Text>
          <XStack gap="$1.5" items="center">
            <IdCard size={14} color="$color9" />
            <Text
              fontSize="$3"
              fontWeight="600"
              color="$color10"
              fontVariant={["tabular-nums"]}
              numberOfLines={1}
            >
              {data.mrn || placeholder}
            </Text>
          </XStack>
          {data.hospital?.name ? (
            <XStack gap="$1.5" items="center">
              <HospitalIcon size={14} color="$color9" />
              <Text fontSize="$3" color="$color9" numberOfLines={1}>
                {data.hospital.name}
              </Text>
            </XStack>
          ) : null}
        </YStack>
      </XStack>

      <Separator borderColor="$borderColor" />

      {/* Trust note: states the read-only invariant plainly. Not a tappable row. */}
      <XStack gap="$2.5" items="flex-start">
        <YStack mt="$0.5">
          <ShieldCheck size={18} color="$accent9" />
        </YStack>
        <YStack gap="$0.5" flex={1}>
          <Text fontSize="$3" fontWeight="700" color="$color12">
            {T("profile.viewOnly.title")}
          </Text>
          <Paragraph fontSize="$2" color="$color10" lineHeight={18}>
            {T("profile.viewOnly.detail")}
          </Paragraph>
        </YStack>
      </XStack>
    </Panel>
  );

  // Contact + coverage details. MRN and facility intentionally live in the identity
  // card above (the "is this me?" fields), so they are not repeated here.
  const details = (
    <Section title={T("profile.details")}>
      <Panel py="$2">
        <DetailRow
          Icon={ShieldHalf}
          label={T("profile.field.insurance")}
          value={data.insuranceNumber}
          placeholder={placeholder}
        />
        <Separator borderColor="$borderColor" />
        <DetailRow
          Icon={Phone}
          label={T("profile.field.phone")}
          value={data.phone}
          placeholder={placeholder}
        />
      </Panel>
    </Section>
  );

  return (
    <Screen>
      <XStack items="center" justify="space-between" gap="$3">
        <Text fontSize="$8" fontWeight="800" color="$color12">
          {T("profile.title")}
        </Text>
        <LanguageToggle />
      </XStack>

      {media.md ? (
        <XStack gap="$5" items="flex-start">
          <YStack flex={3}>{identityCard}</YStack>
          <YStack flex={2}>{details}</YStack>
        </XStack>
      ) : (
        <YStack gap="$4">
          {identityCard}
          {details}
        </YStack>
      )}

      <Separator borderColor="$borderColor" my="$2" />
      <SignOutButton />
    </Screen>
  );
}
