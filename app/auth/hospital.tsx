import React from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle, CreditCard, ShieldCheck } from "@tamagui/lucide-icons";
import { Button, Text, XStack, YStack } from "tamagui";

import { trpc } from "@/utils/trpc";
import {
  AuthError,
  AuthField,
  AuthSelectField,
  AuthSubmit,
  friendlyAuthError,
} from "@/components/auth/input";
import { HospitalSelect } from "@/components/auth/sign-in";
import { ScanVisitTicket } from "@/components/auth/scan";
import { AuthLayout, FormStack } from "@/components/auth/layout";
import { Skeleton } from "@/components/ui";

type SignInForm = { mrn: string; server: string };

/** The working sign-in: hospital + MRN (+ scan), routed to 2FA verify. Its own page. */
export default function HospitalSignIn() {
  // When launched from the app-account "Add hospital" flow, carry the claim flag to verify.
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
    isLoading: isHospitalsLoading,
    isError: isHospitalsError,
    refetch: refetchHospitals,
    isRefetching: isHospitalsRefetching,
  } = trpc.hospitals.useQuery();

  const { mutateAsync: signIn, isPending, error } = trpc.signIn.useMutation();

  const selectedServer = watch("server");
  const mrnValue = watch("mrn");
  const selectedHospital = hospitals?.find((h) => h.hospital.server === selectedServer);
  const hospitalsReady = Boolean(hospitals && hospitals.length > 0);

  const handleSignIn = async (data: SignInForm) => {
    try {
      const response = await signIn(data);
      if (response?.verification) {
        const q = new URLSearchParams({
          token: response.cookie,
          field: response.verification.field.label,
          value: response.verification.field.value,
          ...(claim === "1" ? { claim: "1" } : {}),
        }).toString();
        router.push(`/auth/verify?${q}`);
      }
    } catch {
      // surfaced via friendlyAuthError(error) below
    }
  };

  const handleScan = (data: string) => {
    const mrn = data.trim();
    setValue("mrn", mrn, { shouldValidate: true });
    if (!selectedServer) {
      setError("server", {
        type: "required",
        message: "First choose your hospital, then scan your ticket.",
      });
      return;
    }
    clearErrors("server");
    handleSignIn({ mrn, server: selectedServer });
  };

  return (
    <AuthLayout>
      <XStack
        items="center"
        gap="$2"
        onPress={() => router.back()}
        pressStyle={{ opacity: 0.6 }}
        cursor="pointer"
        mb="$1"
      >
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Back
        </Text>
      </XStack>

      <YStack gap="$1" mb="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Sign in from your hospital
        </Text>
        <Text fontSize={14} color="$text2">
          Use the record number from your hospital card or visit ticket.
        </Text>
      </YStack>

      {selectedHospital ? (
        <XStack items="center" gap="$2.5" px="$3" py="$2.5" rounded={12} bg="$primarySoft">
          <ShieldCheck size={16} color="$primary" />
          <Text fontSize={13} color="$color12" flex={1} numberOfLines={1}>
            Signing in to{" "}
            <Text fontWeight="700" color="$color12">
              {selectedHospital.name}
            </Text>
          </Text>
        </XStack>
      ) : null}

      <FormStack>
        {isHospitalsError || (!isHospitalsLoading && !hospitalsReady) ? (
          <AuthSelectField
            label="Hospital"
            htmlFor="hospital"
            error={
              isHospitalsError
                ? "We could not load the hospital list. Please try again."
                : "No hospitals are available right now. Please try again shortly."
            }
          >
            <Button
              height={52}
              rounded={14}
              bg="$surface"
              borderWidth={1}
              borderColor="$borderStrong"
              disabled={isHospitalsRefetching}
              onPress={() => refetchHospitals()}
            >
              <Button.Text fontSize="$4" fontWeight="700" color="$color12">
                {isHospitalsRefetching ? "Trying again" : "Try again"}
              </Button.Text>
            </Button>
          </AuthSelectField>
        ) : isHospitalsLoading ? (
          <YStack gap="$2">
            <Skeleton height={16} width="30%" rounded="$3" />
            <Skeleton height={52} rounded={14} width="100%" />
          </YStack>
        ) : (
          <Controller
            control={control}
            rules={{ required: "Choose your hospital to continue." }}
            name="server"
            render={({ field: { onChange, value } }) => (
              <AuthSelectField
                label="Hospital"
                htmlFor="hospital"
                helper="Your records are kept at one hospital."
                error={errors.server?.message}
              >
                <HospitalSelect
                  id="hospital"
                  items={hospitals ?? []}
                  invalid={Boolean(errors.server)}
                  value={hospitals?.find((h) => h.hospital.server === value)?.name}
                  onValueChange={(name) =>
                    onChange(
                      hospitals?.find((h) => h.name === name)?.hospital.server ?? "",
                    )
                  }
                />
              </AuthSelectField>
            )}
          />
        )}

        <Controller
          control={control}
          rules={{
            required: "Enter your Medical Record Number.",
            minLength: { value: 4, message: "That MRN looks too short." },
          }}
          name="mrn"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthField
              label="Medical Record Number (MRN)"
              nativeID="mrn"
              Icon={CreditCard}
              value={value}
              onChangeText={(t) => onChange(t.trim())}
              onBlur={onBlur}
              placeholder="ABCD123456"
              helper="Printed on your hospital card or visit ticket sticker."
              error={errors.mrn?.message}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(handleSignIn)}
            />
          )}
        />

        {mrnValue && !errors.mrn ? (
          <XStack items="center" gap="$2" px="$1">
            <CheckCircle size={15} color="$good" />
            <Text fontSize={12} color="$text2">
              Record number captured.
            </Text>
          </XStack>
        ) : null}

        <AuthError message={friendlyAuthError(error, "signin")} />

        <AuthSubmit
          label="Continue"
          pendingLabel="Checking your record"
          pending={isPending}
          disabled={!hospitalsReady}
          Icon={ShieldCheck}
          onPress={handleSubmit(handleSignIn)}
        />
      </FormStack>

      <ScanVisitTicket onScan={handleScan} />
    </AuthLayout>
  );
}
