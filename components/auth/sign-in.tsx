import React, { useState } from "react";
import {
  Adapt,
  AnimatePresence,
  Button,
  FontSizeTokens,
  getFontSize,
  H1,
  Select,
  SelectProps,
  Sheet,
  Spinner,
  Text,
  Theme,
  View,
  YStack,
} from "tamagui";
import { Input } from "./input";
import { useForm, Controller } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons";
import { StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X } from "@tamagui/lucide-icons";
import { throttle } from "lodash";

/** simulate signin */
function useSignIn() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  return {
    status: status,
    signIn: () => {
      setStatus("loading");
      setTimeout(() => {
        setStatus("success");
      }, 2000);
    },
  };
}

export function SelectDemoItem<T extends { name: string }>(
  props: SelectProps & { items: T[] },
) {
  return (
    <Select {...props}>
      <Select.Trigger iconAfter={ChevronDown}>
        <Select.Value placeholder="Select a hospital" />
      </Select.Trigger>

      <Adapt platform="touch">
        <Sheet native={true} modal dismissOnSnapToBottom animation="quickest">
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay
            bg="$shadowColor"
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Select.Content zIndex={200000}>
        <Select.ScrollUpButton
          justify="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack z={10}>
            <ChevronUp size={20} />
          </YStack>
        </Select.ScrollUpButton>

        <Select.Viewport minW={200}>
          <Select.Group>
            {React.useMemo(
              () =>
                props.items.map((item, i) => {
                  return (
                    <Select.Item index={i} key={item.name} value={item.name}>
                      <Select.ItemText fontSize="$5">
                        {i + 1}. {item.name}
                      </Select.ItemText>
                      <Select.ItemIndicator marginLeft="auto">
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  );
                }),
              [props.items],
            )}
          </Select.Group>
          {/* Native gets an extra icon */}
          {props.native && (
            <YStack
              position="absolute"
              r={0}
              t={0}
              b={0}
              justify="center"
              width={"$4"}
              pointerEvents="none"
            >
              <ChevronDown
                size={getFontSize((props.size as FontSizeTokens) ?? "$true")}
              />
            </YStack>
          )}
        </Select.Viewport>

        <Select.ScrollDownButton
          justify="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack z={10}>
            <ChevronDown size={20} />
          </YStack>
        </Select.ScrollDownButton>
      </Select.Content>
    </Select>
  );
}

export function SignInScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues: {
      mrn: "",
      server: "",
    },
  });
  const { data, isLoading } = trpc.hospitals.useQuery();
  const {
    mutate,
    isPending,
    data: user,
    error,
    isSuccess,
  } = trpc.signIn.useMutation();

  if (isLoading)
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );

  const onSubmit = (data: any) => mutate(data);

  const shouldCheckVerification = isSuccess && user?.verification;

  return (
    <View flexDirection="column" minW="100%" maxW="100%" gap="$4">
      <H1
        size="$8"
        $xs={{
          size: "$7",
        }}
      >
        {shouldCheckVerification
          ? "Verify to view your personal health records"
          : "Sign in to view your personal health records"}
      </H1>
      <View flexDirection="column" gap="$3">
        {shouldCheckVerification ? (
          <View>
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input size="$4">
                  <Input.Label> {user?.verification?.field.label}</Input.Label>
                  <Input.Box>
                    <Input.Area placeholder="" />
                  </Input.Box>
                </Input>
              )}
              name={user?.verification?.field.value ?? ""}
            />
          </View>
        ) : (
          <React.Fragment></React.Fragment>
        )}
      </View>
      <Theme inverse>
        <Button
          disabled={isPending}
          onPress={handleSubmit(onSubmit)}
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
          <Button.Text>
            {shouldCheckVerification ? "Sign In" : "Proceed"}
          </Button.Text>
        </Button>
      </Theme>

      {!shouldCheckVerification && (
        <ScanVisitTicket
          onScan={(data: string) => mutate({ mrn: data, server: "" })}
        />
      )}

      {user && (
        <View>
          <Text>Welcome, {user.ref}</Text>
        </View>
      )}

      {error && (
        <View>
          <Text>{error.message}</Text>
        </View>
      )}
    </View>
  );
}

function ScanVisitTicket({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  if (!permission) {
    return <View />;
  }

  const handleScan = throttle(
    ({ data }: { data: string }) => {
      onScan(data);
    },
    1000,
    { leading: true, trailing: false },
  );

  return (
    <>
      <YStack justify="center">
        <View flexDirection="row" justify="center" width="100%" gap="$4">
          <View flex={1} height={1} bg="$borderColor" />
          <Text py="$4" color="gainsboro" mt="$-5">
            OR
          </Text>
          <View flex={1} height={1} bg="$borderColor" />
        </View>

        <Button
          icon={showCamera ? X : undefined}
          onPress={() => {
            if (permission.granted) setShowCamera(!showCamera);
            else requestPermission();
          }}
        >
          <Button.Text>
            {showCamera ? "Close Scanner" : "Scan Your Ticket"}
          </Button.Text>
        </Button>
      </YStack>

      {showCamera && (
        <View position="absolute" t={0} l={0} r={0} b={0} z={1000}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={({ data }) => {
              setShowCamera(false);
              handleScan({ data });
            }}
          />
        </View>
      )}
    </>
  );
}
