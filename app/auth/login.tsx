import React, { useState } from "react";

import { router, useRouter } from "expo-router";
import {
  AnimatePresence,
  Button,
  H1,
  Spinner,
  Text,
  Theme,
  View,
} from "tamagui";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { Input } from "@/components/auth/input";
import { SelectDemoItem } from "@/components/auth/sign-in";
import { ScanVisitTicket } from "@/components/auth/scan";
import { AuthLayout } from "@/components/auth/layout";

export default function SignIn() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      mrn: "",
      server: "",
    },
  });

  const { data: hospitals, isLoading: isHospitalsLoading } =
    trpc.hospitals.useQuery();

  const { mutateAsync: signIn, isPending, error } = trpc.signIn.useMutation();

  const handleSignIn = async (data: { mrn: string; server: string }) => {
    const response = await signIn(data);

    if (response?.verification) {
      router.push(
        `/auth/verify?token=${response.cookie}&field=${response.verification.field.label}&value=${response.verification.field.value}`,
      );
    }
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
          Sign in to view your personal health records
        </H1>

        <View flexDirection="column" gap="$1">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input size="$4">
                <Input.Label htmlFor="hospital">Hospital</Input.Label>
                <SelectDemoItem
                  items={hospitals ?? []}
                  onValueChange={(value) =>
                    onChange(
                      hospitals?.find((h) => h.name === value)?.hospital.server,
                    )
                  }
                  value={
                    hospitals?.find((h) => h.hospital.server === value)?.name
                  }
                />
              </Input>
            )}
            name="server"
          />
        </View>
        <View flexDirection="column" gap="$1">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({
              field: { onChange, onBlur, value, name, ref, disabled },
            }) => (
              <Input size="$4" ref={ref}>
                <View flexDirection="row">
                  <Input.Label htmlFor={"mrn"}>
                    Medical Record Number (MRN)
                  </Input.Label>
                </View>
                <Input.Box>
                  <Input.Area
                    onChange={(e) => onChange(e.nativeEvent.text)}
                    value={value}
                    placeholder="ABCD123456"
                  />
                </Input.Box>
              </Input>
            )}
            name="mrn"
          />
        </View>
        <Theme inverse>
          <Button
            disabled={isPending}
            onPress={handleSubmit(handleSignIn)}
            width="100%"
            icon={
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
            <Button.Text>Sign In</Button.Text>
          </Button>
        </Theme>
        <ScanVisitTicket
          onScan={(data: string) => handleSignIn({ mrn: data, server: "" })}
        />

        <View>
          <Text color="$red10">{error?.message}</Text>
        </View>
      </View>
    </AuthLayout>
  );
}
