/**
 * PII display helpers. `PiiValue` shows a masked value that the patient can reveal by
 * tapping (or globally via `PrivacyToggle`). See utils/privacy.ts.
 */
import { useState } from "react";
import { Eye, EyeOff } from "@tamagui/lucide-icons";
import { Text, XStack } from "tamagui";
import { type PiiKind, maskValue, usePrivacy } from "@/utils/privacy";

/** A maskable PII value: dots by default, tap to reveal (unless globally revealed). */
export function PiiValue({
  value,
  kind = "generic",
  fontSize = 14,
  fontWeight = "600",
  color = "$color12",
  mono = true,
}: {
  value?: string;
  kind?: PiiKind;
  fontSize?: number;
  fontWeight?: any;
  color?: any;
  mono?: boolean;
}) {
  const revealAll = usePrivacy((s) => s.revealAll);
  const [local, setLocal] = useState(false);
  const shown = revealAll || local;
  const has = !!value && value.trim().length > 0;
  const display = !has ? "—" : shown ? value! : maskValue(value, kind);

  return (
    <XStack
      items="center"
      gap="$1.5"
      onPress={has && !revealAll ? () => setLocal((v) => !v) : undefined}
      pressStyle={has && !revealAll ? { opacity: 0.6 } : undefined}
    >
      <Text fontSize={fontSize} fontWeight={fontWeight} color={color} fontFamily={mono ? "$mono" : "$body"} letterSpacing={shown ? 0 : 1}>
        {display}
      </Text>
      {has && !revealAll ? (
        local ? <EyeOff size={13} color="$text3" /> : <Eye size={13} color="$text3" />
      ) : null}
    </XStack>
  );
}

/** Header chip to reveal/hide all PII at once. */
export function PrivacyToggle() {
  const revealAll = usePrivacy((s) => s.revealAll);
  const setRevealAll = usePrivacy((s) => s.setRevealAll);
  return (
    <XStack
      items="center"
      gap="$1.5"
      px="$2.5"
      height={32}
      rounded={16}
      bg="$surface"
      borderWidth={1}
      borderColor="$border"
      onPress={() => setRevealAll(!revealAll)}
      pressStyle={{ opacity: 0.7 }}
    >
      {revealAll ? <Eye size={14} color="$text2" /> : <EyeOff size={14} color="$text2" />}
      <Text fontSize={12} fontWeight="600" color="$text2">
        {revealAll ? "Hide" : "Show"}
      </Text>
    </XStack>
  );
}
