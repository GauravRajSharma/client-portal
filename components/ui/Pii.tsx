/**
 * PII display helpers. `PiiValue` shows a masked value that the patient can reveal by
 * tapping (or globally via `PrivacyToggle`). See utils/privacy.ts.
 */
import { useState } from "react";
import { Eye, EyeOff, C } from "@/components/ui/icons";
import { HStack, Text, Pressable } from "./gs";
import { type PiiKind, maskValue, usePrivacy } from "@/utils/privacy";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

/**
 * A maskable PII value: dots by default, tap to reveal (unless globally revealed).
 * `className` styles the text (size/weight/color); `mono` toggles the mono face.
 */
export function PiiValue({
  value,
  kind = "generic",
  className,
  mono = true,
}: {
  value?: string;
  kind?: PiiKind;
  className?: string;
  mono?: boolean;
}) {
  const revealAll = usePrivacy((s) => s.revealAll);
  const [local, setLocal] = useState(false);
  const shown = revealAll || local;
  const has = !!value && value.trim().length > 0;
  const display = !has ? "—" : shown ? value! : maskValue(value, kind);
  const tappable = has && !revealAll;

  const body = (
    <>
      <Text
        className={cx("text-[14px] font-plex-semibold text-fg", mono && "font-plex-mono", className)}
        style={{ letterSpacing: shown ? 0 : 1 }}
      >
        {display}
      </Text>
      {tappable ? local ? <EyeOff size={13} color={C.text3} /> : <Eye size={13} color={C.text3} /> : null}
    </>
  );

  if (!tappable) return <HStack className="items-center gap-[4px]">{body}</HStack>;
  return (
    <Pressable onPress={() => setLocal((v) => !v)} className="flex-row items-center gap-[4px] active:opacity-60">
      {body}
    </Pressable>
  );
}

/** Header chip to reveal/hide all PII at once. */
export function PrivacyToggle() {
  const revealAll = usePrivacy((s) => s.revealAll);
  const setRevealAll = usePrivacy((s) => s.setRevealAll);
  return (
    <Pressable
      onPress={() => setRevealAll(!revealAll)}
      className="flex-row items-center gap-[4px] px-[10px] h-[32px] rounded-[16px] bg-surface border border-border active:opacity-70"
    >
      {revealAll ? <Eye size={14} color={C.text2} /> : <EyeOff size={14} color={C.text2} />}
      <Text className="text-[12px] font-plex-semibold text-text2">{revealAll ? "Hide" : "Show"}</Text>
    </Pressable>
  );
}
