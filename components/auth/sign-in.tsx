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
import { TextInput } from "react-native";

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
  } = useForm({
    defaultValues: {
      mrn: "",
      server: "",
    },
  });
  const { data, isLoading } = trpc.hospitals.useQuery();
  const { mutate, isPending, data: user, error } = trpc.signIn.useMutation();

  if (isLoading)
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );

  const onSubmit = (data: any) => mutate(data);

  return (
    <View flexDirection="column" minW="100%" maxW="100%" gap="$4">
      <H1
        size="$8"
        $xs={{
          size: "$7",
        }}
      >
        Sign in to view your personal health records
      </H1>
      <View flexDirection="column" gap="$3">
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
                  items={data ?? []}
                  onValueChange={(value) =>
                    onChange(
                      data?.find((h) => h.name === value)?.hospital.server,
                    )
                  }
                  value={data?.find((h) => h.hospital.server === value)?.name}
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
          <Button.Text>Sign In</Button.Text>
        </Button>
      </Theme>

      {user && (
        <View>
          <Text>
            Welcome, {user.name} {user.cookie}
          </Text>
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

// Swap for your own Link
const Link = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <View href={href} tag="a">
      {children}
    </View>
  );
};
