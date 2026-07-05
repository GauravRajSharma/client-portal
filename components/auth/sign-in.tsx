import React, { useState } from "react";
import { Modal } from "react-native";
import { Pressable, ScrollView, Text, HStack, VStack } from "@/components/ui/gs";
import { Building2, Check, ChevronDown, Hospital, C } from "@/components/ui/icons";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

type HospitalSelectProps<T extends { name: string }> = {
  items: T[];
  placeholder?: string;
  invalid?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  id?: string;
};

/**
 * HospitalSelect — Clinical Slate hospital picker.
 *
 * Web: a native-feeling dropdown. Touch: a bottom sheet (large rows, easy to tap on
 * low-end Android). The trigger reads as a real form control: leading hospital icon,
 * the selected name (or a clear placeholder), trailing chevron, full-height tap target.
 *
 * Visual + a11y only. No data writes; selection just sets the form's server value.
 */
export function HospitalSelect<T extends { name: string }>(props: HospitalSelectProps<T>) {
  const { items, placeholder = "Select your hospital", invalid, value, onValueChange } = props;
  const [open, setOpen] = useState(false);

  const rows = React.useMemo(
    () =>
      items.map((item) => {
        const selected = value === item.name;
        return (
          <Pressable
            key={item.name}
            onPress={() => {
              onValueChange?.(item.name);
              setOpen(false);
            }}
            className="flex-row items-center h-[52px] px-[15px] gap-[12px] active:opacity-70"
          >
            <Hospital size={18} color={C.text3} />
            <Text className="text-[16px] text-fg flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            {selected ? <Check size={18} color={C.primary} /> : null}
          </Pressable>
        );
      }),
    [items, value, onValueChange],
  );

  return (
    <React.Fragment>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        className={cx(
          "flex-row items-center gap-[10px] h-[52px] rounded-[10px] px-[15px] bg-surface2 border active:opacity-80",
          invalid ? "border-bad" : "border-border",
        )}
      >
        <Building2 size={18} color={C.text3} />
        <Text
          className={cx("text-[16px] flex-1", value ? "text-fg" : "text-text3")}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <ChevronDown size={18} color={C.text3} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <VStack className="flex-1 justify-end">
          {/* Dimmed backdrop; tap to dismiss. */}
          <Pressable
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(16,36,61,0.45)" }}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close hospital picker"
          />
          <VStack className="bg-surface rounded-t-[20px] pt-[7px] pb-[30px]">
            <VStack className="w-[36px] h-[4px] rounded-full bg-surface3 self-center" />
            <VStack className="px-[17px] py-[12px]">
              <Text className="text-[18px] font-plex-bold text-fg">Choose your hospital</Text>
              <Text className="text-[12px] text-text3">Where your records are kept</Text>
            </VStack>
            <ScrollView>
              {items.length === 0 ? (
                <VStack className="px-[15px] py-[17px]">
                  <Text className="text-[13px] text-text3">No hospitals available right now.</Text>
                </VStack>
              ) : null}
              {rows}
            </ScrollView>
          </VStack>
        </VStack>
      </Modal>
    </React.Fragment>
  );
}

/** Backwards-compatible alias for the old call site name. */
export const SelectDemoItem = HospitalSelect;
