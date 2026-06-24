import React, { useState } from "react";
import { Redirect, router, useGlobalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  Phone,
} from "@tamagui/lucide-icons";
import { Button, H1, Paragraph, Text, XStack, YStack } from "tamagui";

import { trpc } from "@/utils/trpc";
import {
  AuthError,
  AuthField,
  AuthSubmit,
  friendlyAuthError,
} from "@/components/auth/input";
import { AuthLayout, FormStack } from "@/components/auth/layout";

export default function VerificationPage() {
  const params = useGlobalSearchParams<{
    token: string;
    field: string;
    value: string;
    claim?: string;
  }>();
  const token = params.token;
  const field = params.field;
  const value = params.value;
  const isClaim = params.claim === "1";

  const isPhone = value === "mobile";
  // Recognition, not a secret: the patient is confirming their OWN number, so show it
  // by default for phone (and avoid the password keyboard that breaks phone-pad on
  // Android). Insurance numbers start hidden but can be revealed.
  const [reveal, setReveal] = useState(isPhone);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues: { [value ?? "-"]: "" },
  });

  const { mutateAsync: verify, isPending, error } = trpc.verify.useMutation();
  const { mutateAsync: linkHospital } = trpc.linkHospital.useMutation();

  if (!token || !field || !value) return <Redirect href="/" />;

  const fieldName = value;
  const fieldLower = field.toLowerCase();

  const handleVerify = async (data: Record<string, string>) => {
    try {
      const response = await verify({ token, value: data?.[fieldName] });
      if (response) {
        if (isClaim) {
          // Claiming into an app account: link this record, return to the picker.
          await linkHospital({ accessToken: response.accessToken });
          router.replace("/auth/hospitals" as any);
        } else {
          await AsyncStorage.setItem("access:token", response.accessToken);
          router.replace(`/patient/${response.uuid}/home` as any);
        }
      }
    } catch {
      // surfaced via `error` below
    }
  };

  return (
    <AuthLayout>
      <YStack gap="$2">
        <Button
          self="flex-start"
          size="$2"
          chromeless
          px="$1"
          color="$color10"
          icon={<ArrowLeft size={16} color="$color10" />}
          onPress={() => router.back()}
          accessibilityLabel="Go back to sign in"
        >
          <Button.Text fontSize="$3" color="$color10">
            Back
          </Button.Text>
        </Button>

        <H1 size="$8" $md={{ size: "$9" }} fontWeight="800" color="$color12">
          Confirm it is you
        </H1>
        <Paragraph fontSize="$4" color="$color10" lineHeight="$5">
          For your privacy, enter your {fieldLower} to open your health record.
        </Paragraph>
      </YStack>

      <FormStack>
        <Controller
          control={control}
          rules={{ required: `Enter your ${fieldLower}.` }}
          name={fieldName}
          render={({ field: { onChange, onBlur, value: v } }) => (
            <AuthField
              label={field}
              nativeID="verify-field"
              Icon={isPhone ? Phone : BadgeCheck}
              value={v}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={isPhone ? "98XXXXXXXX" : "Your insurance number"}
              helper={
                isPhone
                  ? "The mobile number registered at your hospital."
                  : "The insurance number registered at your hospital."
              }
              error={errors[fieldName]?.message as string | undefined}
              secureTextEntry={!reveal}
              keyboardType={isPhone ? "phone-pad" : "default"}
              inputMode={isPhone ? "tel" : "text"}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(handleVerify)}
              trailing={
                <Button
                  width={44}
                  height={44}
                  circular
                  chromeless
                  hitSlop={8}
                  icon={
                    reveal ? (
                      <EyeOff size={20} color="$color10" />
                    ) : (
                      <Eye size={20} color="$color10" />
                    )
                  }
                  onPress={() => setReveal((r) => !r)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    reveal ? `Hide ${fieldLower}` : `Show ${fieldLower}`
                  }
                />
              }
            />
          )}
        />

        <AuthError message={friendlyAuthError(error, "verify")} />

        <AuthSubmit
          label="Verify and continue"
          pendingLabel="Verifying"
          pending={isPending}
          Icon={BadgeCheck}
          onPress={handleSubmit(handleVerify)}
        />
      </FormStack>

      <XStack items="center" gap="$2" px="$1">
        <Text fontSize="$2" color="$color10" flex={1}>
          This step keeps your record private to you.
        </Text>
      </XStack>
    </AuthLayout>
  );
}
