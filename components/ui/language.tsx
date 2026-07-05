import { type Lang, useLang } from "@/utils/i18n";
import { HStack, Text, Pressable } from "./gs";

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

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <HStack className="bg-surface3 rounded-full p-[1px] gap-[1px] self-start" role="radiogroup">
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setLang(opt.value)}
            className={cx(
              "px-[15px] py-[10px] min-h-[40px] items-center justify-center rounded-full active:opacity-70",
              active ? "bg-primary" : "bg-transparent",
            )}
            role="radio"
            aria-checked={active}
          >
            <Text className={cx("text-[13px]", active ? "font-plex-bold text-onPrimary" : "font-plex-semibold text-fg")}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}
