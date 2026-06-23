import { type Lang, useLang } from "@/utils/i18n";
import { Text, Theme, XStack } from "tamagui";

/**
 * LanguageToggle — a compact, persistent EN / नेपाली segmented control.
 *
 * A segmented toggle (not a dropdown) because there are exactly two languages and both
 * fit on screen: the choice and its current state are visible at a glance, which is what
 * a mixed-literacy audience needs. The active segment carries the accent; the inactive
 * one stays quiet. Persistence is handled by the i18n store.
 */
const OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ne", label: "नेपाली" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <XStack
      bg="$color3"
      rounded="$10"
      p="$0.5"
      gap="$0.5"
      self="flex-start"
      role="radiogroup"
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        const segment = (
          <XStack
            key={opt.value}
            px="$3.5"
            py="$2.5"
            minH={40}
            items="center"
            justify="center"
            rounded="$10"
            bg={active ? "$accent9" : "transparent"}
            hoverStyle={active ? {} : { bg: "$color4" }}
            pressStyle={{ opacity: 0.7 }}
            animation="quick"
            onPress={() => setLang(opt.value)}
            cursor="pointer"
            role="radio"
            aria-checked={active}
          >
            <Text
              fontSize="$3"
              fontWeight={active ? "800" : "600"}
              color={active ? "#fff" : "$color11"}
            >
              {opt.label}
            </Text>
          </XStack>
        );
        return active ? (
          <Theme key={opt.value} name="accent">
            {segment}
          </Theme>
        ) : (
          segment
        );
      })}
    </XStack>
  );
}
