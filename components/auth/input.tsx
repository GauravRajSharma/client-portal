// ─────────────────────────────────────────────────────────────────────────────
// AuthField — the field primitive used by the auth screens.
//
// A real form control: a label, an optional leading icon, a large 16px+ text input
// with a visible focus ring (accent), an optional trailing slot (e.g. show/hide), a
// helper line, and an inline error that replaces the helper when present. Designed for
// glare and low-end Android: 52px tap target, high-contrast text, no pill geometry.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import type { NamedExoticComponent, ReactNode } from "react";
import { AlertCircle, C } from "@/components/ui/icons";
import { Button, HStack, Input, Spinner, Text, VStack } from "@/components/ui/gs";

export interface AuthFieldProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  Icon?: NamedExoticComponent<any>;
  /** trailing slot, e.g. a show/hide toggle button */
  trailing?: ReactNode;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "numeric";
  inputMode?: "text" | "numeric" | "tel";
  textContentType?: any;
  autoComplete?: any;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
  nativeID?: string;
}

export function AuthField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  helper,
  error,
  Icon,
  trailing,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);
  const inputId = inputProps.nativeID ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = invalid
    ? `${inputId}-error`
    : helper
      ? `${inputId}-helper`
      : undefined;

  return (
    <VStack className="gap-[7px]">
      <Text className="text-[13px] font-plex-bold text-fg m-0 p-0">{label}</Text>

      <HStack
        className={`items-center gap-[10px] h-[52px] px-[15px] rounded-[10px] bg-surface2 border ${
          invalid ? "border-bad" : focused ? "border-primary" : "border-border"
        }`}
        // Web-only focus ring (react-native-web outline*; ignored on native, where the
        // border-color change above carries the focus affordance).
        style={
          focused
            ? {
                outlineColor: invalid ? C.bad : C.primary,
                outlineWidth: 2,
                outlineStyle: "solid",
              }
            : undefined
        }
      >
        {Icon ? (
          <Icon size={18} color={invalid ? C.bad : C.text3} />
        ) : null}
        <Input
          id={inputId}
          className="flex-1 h-full text-[16px] text-fg font-plex"
          placeholder={placeholder}
          placeholderTextColor={C.text3}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          accessibilityLabel={label}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {trailing}
      </HStack>

      {invalid ? (
        <HStack
          className="items-center gap-[4px]"
          accessibilityLiveRegion="polite"
          aria-live="polite"
        >
          <AlertCircle size={16} color={C.bad} />
          <Text id={`${inputId}-error`} className="text-[13px] text-bad flex-1">
            {error}
          </Text>
        </HStack>
      ) : helper ? (
        <Text id={`${inputId}-helper`} className="text-[13px] text-fg">
          {helper}
        </Text>
      ) : null}
    </VStack>
  );
}

/**
 * AuthSelectField — the same label / helper / inline-error treatment as AuthField,
 * but wrapping an arbitrary control (e.g. the hospital Select). Keeps ONE field and
 * error vocabulary across the form instead of hand-rolling error text per field.
 */
export function AuthSelectField({
  label,
  htmlFor,
  helper,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  const invalid = Boolean(error);
  const inputId = htmlFor ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <VStack className="gap-[7px]">
      <AuthFieldLabel htmlFor={inputId}>{label}</AuthFieldLabel>
      {children}
      {invalid ? (
        <HStack
          className="items-center gap-[4px]"
          accessibilityLiveRegion="polite"
          aria-live="polite"
        >
          <AlertCircle size={16} color={C.bad} />
          <Text id={`${inputId}-error`} className="text-[13px] text-bad flex-1">
            {error}
          </Text>
        </HStack>
      ) : helper ? (
        <Text id={`${inputId}-helper`} className="text-[13px] text-fg">
          {helper}
        </Text>
      ) : null}
    </VStack>
  );
}

/** AuthFieldLabel — a standalone field label, matching AuthField. */
export function AuthFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Text className="text-[13px] font-plex-bold text-fg m-0">{children}</Text>
  );
}

/**
 * AuthSubmit — the single primary action. Accent-themed, full width, large target,
 * shows an inline spinner and disables while pending. One button vocabulary for both
 * the sign-in and verify screens.
 */
export function AuthSubmit({
  label,
  pendingLabel,
  pending,
  disabled,
  onPress,
  Icon,
}: {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  Icon?: NamedExoticComponent<any>;
}) {
  return (
    <Button
      variant="solid"
      onPress={onPress}
      disabled={disabled || pending}
      icon={pending ? () => <Spinner color={C.onPrimary} /> : Icon}
      className="h-[52px] w-full rounded-[10px]"
      textClassName="text-[16px] font-plex-bold"
    >
      {pending ? (pendingLabel ?? label) : label}
    </Button>
  );
}

/**
 * AuthError — a clear top-level error banner (error sub-theme). Announced to screen
 * readers on web (role=alert) and native (accessibilityLiveRegion=assertive).
 */
export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <HStack
      className="items-center gap-[10px] p-[12px] rounded-[10px] bg-badSoft border border-bad"
      role="alert"
      aria-live="assertive"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <AlertCircle size={18} color={C.bad} />
      <Text className="text-[14px] text-bad flex-1 font-plex-semibold">
        {message}
      </Text>
    </HStack>
  );
}

/**
 * friendlyAuthError — map raw tRPC / server errors to calm, plain-language copy with a
 * next step. NEVER show backend strings (they can be technical, English-only, or leak
 * internal server names) to an anxious patient. Falls back to a safe generic line.
 *
 * `context` tailors the not-found / mismatch wording to the screen.
 */
export function friendlyAuthError(
  err: unknown,
  context: "signin" | "verify" = "signin",
): string | undefined {
  if (!err) return undefined;

  const code =
    (err as any)?.data?.code ?? (err as any)?.shape?.data?.code ?? undefined;
  const raw = String((err as any)?.message ?? "").toLowerCase();

  const isNetwork =
    raw.includes("fetch") ||
    raw.includes("network") ||
    raw.includes("timeout") ||
    raw.includes("failed to fetch") ||
    code === "TIMEOUT";

  if (isNetwork) {
    return "We could not connect right now. Please check your internet and try again.";
  }

  if (context === "verify") {
    // Any verify failure is, to the patient, "that did not match".
    return "That does not match what your hospital has on file. Please check and try again.";
  }

  if (
    code === "BAD_REQUEST" ||
    raw.includes("not found") ||
    raw.includes("hospital not found") ||
    raw.includes("patient not found")
  ) {
    return "We could not find that record at this hospital. Please check your MRN and the hospital, then try again.";
  }

  if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
    return "We could not verify you. Please check your details and try again.";
  }

  return "Something went wrong. Please try again in a moment.";
}
