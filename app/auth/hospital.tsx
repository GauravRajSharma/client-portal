import React from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { backOr } from "@/utils/nav";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck, C } from "@/components/ui/icons";
import { Button, Input, Spinner, Text, HStack, VStack, Pressable } from "@/components/ui/gs";

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
    <VStack className="gap-[4px]">
      <Text className="text-[12.5px] font-plex-bold text-text2">{label}</Text>
      {children}
      {error ? <Text className="text-[12px] text-bad">{error}</Text> : null}
    </VStack>
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
  const mrnValue = watch("mrn");

  // Auto-select the hospital from the MRN's leading prefix (e.g. "GPKH123456" → GPKH),
  // mirroring the server's prefix match (see signIn). Longest prefix wins so 3- and
  // 4-char prefixes don't clash. Only sets when it differs, so manual picks still work.
  React.useEffect(() => {
    if (!hospitals?.length) return;
    const up = mrnValue.trim().toUpperCase();
    if (up.length < 3) return;
    const match = [...hospitals]
      .sort((a, b) => b.hospital.prefix.length - a.hospital.prefix.length)
      .find((h) => up.startsWith(h.hospital.prefix.toUpperCase()));
    if (match && match.hospital.server !== selectedServer) {
      setValue("server", match.hospital.server, { shouldValidate: true });
      clearErrors("server");
    }
  }, [mrnValue, hospitals, selectedServer, setValue, clearErrors]);

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
      <Pressable
        onPress={() => backOr("/auth/login")}
        className="flex-row items-center gap-[7px] self-start active:opacity-60"
      >
        <ArrowLeft size={18} color={C.text2} />
        <Text className="text-[14px] font-plex-medium text-text2">Back</Text>
      </Pressable>

      <VStack className="gap-[2px]">
        <Text className="text-[22px] font-plex-bold text-fg tracking-[-0.4px]">
          {claim === "1" ? "Add a hospital" : "Sign in with your hospital"}
        </Text>
        <Text className="text-[13.5px] text-text2">
          Use the record number from your hospital card or visit ticket.
        </Text>
      </VStack>

      <VStack className="gap-[12px]">
        <FieldRow label="Hospital" error={errors.server?.message}>
          {hospitalsLoading ? (
            <Skeleton className="h-[50px] rounded-[14px] w-full" />
          ) : hospitalsError || !hospitals?.length ? (
            <Button
              variant="outline"
              disabled={isRefetching}
              onPress={() => refetchHospitals()}
              className="h-[50px] rounded-[14px]"
              textClassName="text-[14px] font-plex-bold text-fg"
            >
              {isRefetching ? "Trying again…" : "Couldn't load hospitals — retry"}
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
              <HStack
                className={`h-[50px] rounded-[14px] border ${errors.mrn ? "border-bad" : "border-border"} bg-surface2 items-center px-[15px] gap-[10px]`}
              >
                <CreditCard size={18} color={C.text3} />
                <Input
                  className="flex-1 text-[15px] text-fg"
                  placeholder="ABCD123456"
                  placeholderTextColor={C.text3}
                  value={value}
                  onChangeText={(t) => onChange(t.trim())}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(go)}
                />
              </HStack>
            )}
          />
        </FieldRow>

        {error ? (
          <Text className="text-[12.5px] text-bad">{friendlyAuthError(error, "signin")}</Text>
        ) : null}

        <Button
          variant="solid"
          onPress={isPending ? undefined : handleSubmit(go)}
          className={`h-[52px] rounded-[14px] ${isPending ? "opacity-70" : ""}`}
        >
          <HStack className="items-center gap-[10px]">
            {isPending ? (
              <Spinner color={C.onPrimary} />
            ) : (
              <ShieldCheck size={18} color={C.onPrimary} />
            )}
            <Text className="text-[16px] font-plex-bold text-onPrimary">
              {isPending ? "Checking your record…" : "Continue"}
            </Text>
            {!isPending ? <ArrowRight size={18} color={C.onPrimary} /> : null}
          </HStack>
        </Button>
      </VStack>

      <ScanVisitTicket onScan={onScan} />
    </AuthLayout>
  );
}
