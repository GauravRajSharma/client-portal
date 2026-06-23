import React from "react";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  CheckCircle,
  CreditCard,
  ShieldCheck,
} from "@tamagui/lucide-icons";
import { Button, H1, Paragraph, Text, Theme, XStack, YStack } from "tamagui";

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

export default function SignIn() {
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SignInForm>({
    defaultValues: { mrn: "", server: "" },
  });

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
  const selectedHospital = hospitals?.find(
    (h) => h.hospital.server === selectedServer,
  );

  const hospitalsReady = Boolean(hospitals && hospitals.length > 0);

  const handleSignIn = async (data: SignInForm) => {
    try {
      const response = await signIn(data);
      if (response?.verification) {
        const q = new URLSearchParams({
          token: response.cookie,
          field: response.verification.field.label,
          value: response.verification.field.value,
        }).toString();
        router.push(`/auth/verify?${q}`);
      }
    } catch {
      // surfaced via friendlyAuthError(error) below
    }
  };

  // Scanning is the path for patients who cannot type an MRN. Route it through the
  // same validation as the button: never auto-submit a form that would fail its own
  // required rules (e.g. no hospital chosen).
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
      <YStack gap="$2">
        <H1 size="$8" $md={{ size: "$9" }} fontWeight="800" color="$color12">
          Sign in
        </H1>
        <Paragraph fontSize="$4" color="$color10" lineHeight="$5">
          View your visits, lab results, medicines, and bills from your
          hospital.
        </Paragraph>
      </YStack>

      {selectedHospital ? (
        <Theme name="accent">
          <XStack
            items="center"
            gap="$2.5"
            px="$3"
            py="$2.5"
            rounded="$5"
            bg="$color3"
          >
            <ShieldCheck size={16} color="$color9" />
            <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
              Signing in to{" "}
              <Text fontWeight="800" color="$color11">
                {selectedHospital.name}
              </Text>
            </Text>
          </XStack>
        </Theme>
      ) : null}

      <FormStack>
        {isHospitalsError ? (
          <AuthSelectField
            label="Hospital"
            htmlFor="hospital"
            error="We could not load the hospital list. Please try again."
          >
            <Button
              height={52}
              rounded="$5"
              bg="$color1"
              borderWidth={1}
              borderColor="$borderColor"
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
            <Skeleton height={52} rounded="$5" width="100%" />
          </YStack>
        ) : !hospitalsReady ? (
          <AuthSelectField
            label="Hospital"
            htmlFor="hospital"
            error="No hospitals are available right now. Please try again shortly."
          >
            <Button
              height={52}
              rounded="$5"
              bg="$color1"
              borderWidth={1}
              borderColor="$borderColor"
              disabled={isHospitalsRefetching}
              onPress={() => refetchHospitals()}
            >
              <Button.Text fontSize="$4" fontWeight="700" color="$color12">
                {isHospitalsRefetching ? "Trying again" : "Try again"}
              </Button.Text>
            </Button>
          </AuthSelectField>
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
                  value={
                    hospitals?.find((h) => h.hospital.server === value)?.name
                  }
                  onValueChange={(name) =>
                    onChange(
                      hospitals?.find((h) => h.name === name)?.hospital
                        .server ?? "",
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
              helper="Printed on your hospital card or visit ticket."
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
          <Theme name="success">
            <XStack items="center" gap="$2" px="$1">
              <CheckCircle size={15} color="$color10" />
              <Text fontSize="$2" color="$color11">
                Record number captured.
              </Text>
            </XStack>
          </Theme>
        ) : null}

        <AuthError message={friendlyAuthError(error, "signin")} />

        <AuthSubmit
          label="Sign in"
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
