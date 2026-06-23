import React from "react";
import {
  Adapt,
  type FontSizeTokens,
  type SelectProps,
  Select,
  Sheet,
  Text,
  XStack,
  YStack,
  getFontSize,
} from "tamagui";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Hospital,
} from "@tamagui/lucide-icons";

/**
 * HospitalSelect — Clinical Slate hospital picker.
 *
 * Web: a native-feeling dropdown. Touch: a bottom sheet (large rows, easy to tap on
 * low-end Android). The trigger reads as a real form control: leading hospital icon,
 * the selected name (or a clear placeholder), trailing chevron, full-height tap target.
 *
 * Visual + a11y only. No data writes; selection just sets the form's server value.
 */
export function HospitalSelect<T extends { name: string }>(
  props: SelectProps & { items: T[]; placeholder?: string; invalid?: boolean },
) {
  const { items, placeholder = "Select your hospital", invalid, ...rest } = props;

  return (
    <Select disablePreventBodyScroll {...rest}>
      <Select.Trigger
        height={52}
        bg="$color2"
        borderWidth={1}
        borderColor={invalid ? "$red8" : "$borderColor"}
        rounded="$5"
        px="$3.5"
        focusStyle={{
          borderColor: "$accent8",
          outlineColor: "$accent8",
          outlineWidth: 2,
          outlineStyle: "solid",
        }}
        hoverStyle={{ borderColor: "$borderColorHover" }}
        iconAfter={<ChevronDown size={18} color="$color10" />}
      >
        <XStack items="center" gap="$2.5" flex={1}>
          <Building2 size={18} color="$color10" />
          <Select.Value
            placeholder={placeholder}
            fontSize="$5"
            color="$color12"
          />
        </XStack>
      </Select.Trigger>

      <Adapt platform="touch">
        <Sheet
          native
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
          animation="quick"
        >
          <Sheet.Frame bg="$color1" pt="$2" pb="$6">
            <Sheet.Handle bg="$color5" />
            <YStack px="$4" py="$3">
              <Text fontSize="$6" fontWeight="800" color="$color12">
                Choose your hospital
              </Text>
              <Text fontSize="$2" color="$color10">
                Where your records are kept
              </Text>
            </YStack>
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
          items="center"
          justify="center"
          position="relative"
          width="100%"
          height="$3"
          bg="$color1"
        >
          <ChevronUp size={18} color="$color10" />
        </Select.ScrollUpButton>

        <Select.Viewport minW={260} bg="$color1" rounded="$5">
          {items.length === 0 ? (
            <YStack px="$3.5" py="$4">
              <Text fontSize="$3" color="$color10">
                No hospitals available right now.
              </Text>
            </YStack>
          ) : null}
          <Select.Group>
            {React.useMemo(
              () =>
                items.map((item, i) => (
                  <Select.Item
                    index={i}
                    key={item.name}
                    value={item.name}
                    height={52}
                    px="$3.5"
                    gap="$3"
                    hoverStyle={{ bg: "$color3" }}
                    focusStyle={{ bg: "$color3" }}
                  >
                    <Hospital size={18} color="$color9" />
                    <Select.ItemText fontSize="$5" color="$color12" flex={1}>
                      {item.name}
                    </Select.ItemText>
                    <Select.ItemIndicator marginLeft="auto">
                      <Check size={18} color="$accent9" />
                    </Select.ItemIndicator>
                  </Select.Item>
                )),
              [items],
            )}
          </Select.Group>

          {props.native ? (
            <YStack
              position="absolute"
              r={0}
              t={0}
              b={0}
              justify="center"
              width="$4"
              pointerEvents="none"
            >
              <ChevronDown
                size={getFontSize((props.size as FontSizeTokens) ?? "$true")}
              />
            </YStack>
          ) : null}
        </Select.Viewport>

        <Select.ScrollDownButton
          items="center"
          justify="center"
          position="relative"
          width="100%"
          height="$3"
          bg="$color1"
        >
          <ChevronDown size={18} color="$color10" />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select>
  );
}

/** Backwards-compatible alias for the old call site name. */
export const SelectDemoItem = HospitalSelect;
