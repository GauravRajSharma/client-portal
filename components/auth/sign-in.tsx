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
import { FormCard } from "./layout";
import { trpc } from "@/utils/trpc";
import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons";

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
  const [val, setVal] = React.useState("");

  return (
    <Select value={val} onValueChange={setVal} {...props}>
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
                    <Select.Item
                      index={i}
                      key={item.name}
                      value={item.name.toLowerCase()}
                    >
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
  const { signIn, status } = useSignIn();

  const { data, isLoading } = trpc.hospitals.useQuery();

  const { mutate, isPending } = trpc.signIn.useMutation();

  if (isLoading)
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <FormCard>
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
            <Input size="$4">
              <Input.Label htmlFor="email">Hospital</Input.Label>
              <SelectDemoItem items={data ?? []} />
            </Input>
          </View>
          <View flexDirection="column" gap="$1">
            <Input size="$4">
              <View flexDirection="row">
                <Input.Label htmlFor={"mrn"}>
                  Medical Record Number (MRN)
                </Input.Label>
              </View>
              <Input.Box>
                <Input.Area id="mrn" placeholder="ABCD123456" />
              </Input.Box>
            </Input>
          </View>
        </View>
        <Theme inverse>
          <Button
            disabled={isPending}
            onPress={() => mutate({ mrn: "", server: "" })}
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
      </View>
    </FormCard>
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
