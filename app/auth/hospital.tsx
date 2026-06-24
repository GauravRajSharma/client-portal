import React from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck } from "@tamagui/lucide-icons";
import { Button, Input, Spinner, Text, XStack, YStack } from "tamagui";

import { trpc } from "@/utils/trpc";
import { friendlyAuthError } from "@/components/auth/input";
import { HospitalSelect } from "@/components/auth/sign-in";
import { ScanVisitTicket } from "@/components/auth/scan";
import { AuthLayout } from "@/components/auth/layout";
import { Skeleton } from "@/components/ui";

type SignInForm = { mrn: string; server: string };

/** A labelled field with optional inline error. */
function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <YStack gap="$1.5">
      <Text fontSize={12.5} fontWeight="700" color="$text2">
        {label}
      </Text>
      {children}
      {error ? (
        <Text fontSize={12} color="$bad">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}

/** Hospital record sign-in: pick hospital + MRN (or scan), then 2FA verify. */
export default function HospitalSignIn() {
  // Launched from the app-account "Add hospital" flow -> carry the claim flag to verify.
  const { claim } = useGlobalSearchParams<{ claim?: string }>();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SignInForm>({ defaultValues: { mrn: "", server: "" } });

  const {
    data: hospitals,
    isLoading: hospitalsLoading,
    isError: hospitalsError,
    refetch: refetchHospitals,
    isRefetching,
  } = trpc.hospitals.useQuery();

  const { mutateAsync: signIn, isPending, error } = trpc.signIn.useMutation();
  const selectedServer = watch("server");

  const go = async (data: SignInForm) => {
    try {
      const r = await signIn(data);
      if (r?.verification) {
        const q = new URLSearchParams({
          token: r.cookie,
          field: r.verification.field.label,
          value: r.verification.field.value,
          ...(claim === "1" ? { claim: "1" } : {}),
        }).toString();
        router.push(`/auth/verify?${q}`);
      }
    } catch {
      // surfaced via friendlyAuthError(error) below
    }
  };

  const onScan = (raw: string) => {
    const mrn = raw.trim();
    setValue("mrn", mrn, { shouldValidate: true });
    if (!selectedServer) {
      setError("server", { type: "required", message: "Choose your hospital first." });
      return;
    }
    clearErrors("server");
    go({ mrn, server: selectedServer });
  };

  return (
    <AuthLayout>
      <XStack
        items="center"
        gap="$2"
        self="flex-start"
        onPress={() => router.back()}
        pressStyle={{ opacity: 0.6 }}
      >
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Back
        </Text>
      </XStack>

      <YStack gap="$1">
        <Text fontSize={22} fontWeight="800" color="$color12" letterSpacing={-0.4}>
          {claim === "1" ? "Add a hospital" : "Sign in with your hospital"}
        </Text>
        <Text fontSize={13.5} color="$text2">
          Use the record number from your hospital card or visit ticket.
        </Text>
      </YStack>

      <YStack gap="$3">
        <FieldRow label="Hospital" error={errors.server?.message}>
          {hospitalsLoading ? (
            <Skeleton height={50} rounded={14} width="100%" />
          ) : hospitalsError || !hospitals?.length ? (
            <Button
              height={50}
              rounded={14}
              bg="$surface"
              borderWidth={1}
              borderColor="$border"
              disabled={isRefetching}
              onPress={() => refetchHospitals()}
            >
              <Text fontSize={14} fontWeight="700" color="$color12">
                {isRefetching ? "Trying again…" : "Couldn't load hospitals — retry"}
              </Text>
            </Button>
          ) : (
            <Controller
              control={control}
              rules={{ required: "Choose your hospital to continue." }}
              name="server"
              render={({ field: { onChange, value } }) => (
                <HospitalSelect
                  id="hospital"
                  items={hospitals}
                  invalid={Boolean(errors.server)}
                  value={hospitals.find((h) => h.hospital.server === value)?.name}
                  onValueChange={(name) =>
                    onChange(hospitals.find((h) => h.name === name)?.hospital.server ?? "")
                  }
                />
              )}
            />
          )}
        </FieldRow>

        <FieldRow label="Medical record number (MRN)" error={errors.mrn?.message}>
          <Controller
            control={control}
            rules={{
              required: "Enter your medical record number.",
              minLength: { value: 4, message: "That MRN looks too short." },
            }}
            name="mrn"
            render={({ field: { onChange, onBlur, value } }) => (
              <XStack
                height={50}
                rounded={14}
                borderWidth={1}
                borderColor={errors.mrn ? "$bad" : "$border"}
                bg="$surface2"
                items="center"
                px="$3.5"
                gap="$2.5"
                focusWithinStyle={{ borderColor: "$primary" }}
              >
                <CreditCard size={18} color="$text3" />
                <Input
                  unstyled
                  flex={1}
                  fontSize={15}
                  color="$color12"
                  placeholder="ABCD123456"
                  placeholderTextColor="$text3"
                  value={value}
                  onChangeText={(t) => onChange(t.trim())}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(go)}
                />
              </XStack>
            )}
          />
        </FieldRow>

        {error ? (
          <Text fontSize={12.5} color="$bad">
            {friendlyAuthError(error, "signin")}
          </Text>
        ) : null}

        <Button
          height={52}
          rounded={14}
          bg="$primary"
          borderWidth={0}
          pressStyle={{ bg: "$primaryStrong" }}
          opacity={isPending ? 0.7 : 1}
          onPress={isPending ? undefined : handleSubmit(go)}
        >
          <XStack items="center" gap="$2.5">
            {isPending ? (
              <Spinner color="$onPrimary" />
            ) : (
              <ShieldCheck size={18} color="$onPrimary" />
            )}
            <Text fontSize={16} fontWeight="700" color="$onPrimary">
              {isPending ? "Checking your record…" : "Continue"}
            </Text>
            {!isPending ? <ArrowRight size={18} color="$onPrimary" /> : null}
          </XStack>
        </Button>
      </YStack>

      <ScanVisitTicket onScan={onScan} />
    </AuthLayout>
  );
}
