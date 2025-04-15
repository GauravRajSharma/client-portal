import React from "react";

import { AuthLayout } from "@/components/auth/layout";
import { AnimatePresence, Button, H1, Spinner, Theme, View } from "tamagui";
import { Redirect, router, useGlobalSearchParams } from "expo-router";
import { Text } from "tamagui";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/auth/input";
import { trpc } from "@/utils/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerificationPage() {
  const { token, field, value } = useGlobalSearchParams<{
    token: string;
    field: string;
    value: string;
  }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      [value ?? "-"]: "",
    },
  });

  const { mutateAsync: verify, isPending, error } = trpc.verify.useMutation();

  if (!token || !field || !value) return <Redirect href="/" />;

  const handleVerify = async (data: Record<string, string>) => {
    try {
      const response = await verify({ token, value: data?.[value] });
      if (response) {
        await AsyncStorage.setItem("access:token", response.accessToken);
        router.replace(`/patient/${response.uuid}/visits`);
      }
    } catch (error) {}
  };

  return (
    <AuthLayout>
      <View flexDirection="column" minW="100%" maxW="100%" gap="$4">
        <H1
          size="$8"
          $xs={{
            size: "$7",
          }}
        >
          Verify to view your personal health records
        </H1>

        <View>
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, value } }) => (
              <Input size="$4">
                <Input.Label> {field}</Input.Label>
                <Input.Box>
                  <Input.Area
                    onChange={(e) => onChange(e.nativeEvent.text)}
                    value={value}
                    placeholder=""
                  />
                </Input.Box>
              </Input>
            )}
            name={value ?? ""}
          />
        </View>

        <Theme inverse>
          <Button
            disabled={isPending}
            onPress={handleSubmit(handleVerify)}
            width="100%"
            iconAfter={
              <AnimatePresence>
                {isPending && (
                  <Spinner
                    color="$color"
                    key="loading-spinner"
                    opacity={1}
                    scale={1}
                    animation="quick"
                    position="absolute"
                    enterStyle={{
                      opacity: 0,
                      scale: 0.5,
                    }}
                    exitStyle={{
                      opacity: 0,
                      scale: 0.5,
                    }}
                  />
                )}
              </AnimatePresence>
            }
          >
            <Button.Text>Verify and Proceed</Button.Text>
          </Button>
        </Theme>

        <View>
          <Text color="$red10">{error?.message}</Text>
        </View>
      </View>
    </AuthLayout>
  );
}
