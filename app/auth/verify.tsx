import React, { useState } from "react";
import { Redirect, router, useGlobalSearchParams } from "expo-router";
import { backOr } from "@/utils/nav";
import { Controller, useForm } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  Phone,
  C,
} from "@/components/ui/icons";
import { Heading, Paragraph, Text, HStack, VStack, Pressable, useMedia } from "@/components/ui/gs";

import { trpc } from "@/utils/trpc";
import {
  AuthError,
  AuthField,
  AuthSubmit,
  friendlyAuthError,
} from "@/components/auth/input";
import { AuthLayout, FormStack } from "@/components/auth/layout";

export default function VerificationPage() {
  const media = useMedia();
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
      <VStack className="gap-[7px]">
        <Pressable
          onPress={() => backOr("/auth/hospital")}
          accessibilityLabel="Go back to sign in"
          className="flex-row items-center gap-[7px] self-start px-[2px] py-[2px] active:opacity-60"
        >
          <ArrowLeft size={16} color={C.text3} />
          <Text className="text-[14px] text-text3">Back</Text>
        </Pressable>

        <Heading className={media.md ? "text-[34px]" : "text-[28px]"}>
          Confirm it is you
        </Heading>
        <Paragraph className="text-[15px] text-text3 leading-[22px]">
          For your privacy, enter your {fieldLower} to open your health record.
        </Paragraph>
      </VStack>

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
                <Pressable
                  onPress={() => setReveal((r) => !r)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={reveal ? `Hide ${fieldLower}` : `Show ${fieldLower}`}
                  className="w-[44px] h-[44px] rounded-full items-center justify-center active:opacity-60"
                >
                  {reveal ? (
                    <EyeOff size={20} color={C.text3} />
                  ) : (
                    <Eye size={20} color={C.text3} />
                  )}
                </Pressable>
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

      <HStack className="items-center gap-[7px] px-[2px]">
        <Text className="text-[13px] text-text3 flex-1">
          This step keeps your record private to you.
        </Text>
      </HStack>
    </AuthLayout>
  );
}
