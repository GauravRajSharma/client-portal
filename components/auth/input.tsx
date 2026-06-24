import { getFontSized } from "@tamagui/get-font-sized";
import { getSpace } from "@tamagui/get-token";
import type { SizeVariantSpreadFunction } from "@tamagui/web";
import { useState } from "react";
import type { ColorTokens, FontSizeTokens } from "tamagui";
import {
  Label,
  Button as TButton,
  Input as TInput,
  Text,
  Theme,
  View,
  XGroup,
  createStyledContext,
  getFontSize,
  getVariable,
  isWeb,
  styled,
  useGetThemedIcon,
  useTheme,
  withStaticProperties,
} from "tamagui";

const defaultContextValues = {
  size: "$true",
  scaleIcon: 1.2,
  color: undefined,
} as const;

export const InputContext = createStyledContext<{
  size: FontSizeTokens;
  scaleIcon: number;
  color?: ColorTokens | string;
}>(defaultContextValues);

export const defaultInputGroupStyles = {
  size: "$true",
  fontFamily: "$body",
  borderWidth: 1,
  outlineWidth: 0,
  color: "$color",

  ...(isWeb
    ? {
        tabIndex: 0,
      }
    : {
        focusable: true,
      }),

  borderColor: "$borderColor",
  backgroundColor: "$color2",

  // this fixes a flex bug where it overflows container
  minWidth: 0,

  hoverStyle: {
    borderColor: "$borderColorHover",
  },

  focusStyle: {
    outlineColor: "$outlineColor",
    outlineWidth: 2,
    outlineStyle: "solid",
    borderColor: "$borderColorFocus",
  },
} as const;

const InputGroupFrame = styled(XGroup, {
  context: InputContext,
  variants: {
    unstyled: {
      false: defaultInputGroupStyles,
    },
    scaleIcon: {
      ":number": {} as any,
    },
    applyFocusStyle: {
      ":boolean": (val, { props }) => {
        if (val) {
          return props.focusStyle || defaultInputGroupStyles.focusStyle;
        }
      },
    },
  } as const,
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1",
  },
});

const FocusContext = createStyledContext({
  setFocused: (val: boolean) => {},
  focused: false,
});

// @ts-ignore Tamagui styleable render-fn typing friction under React 19 types
const InputGroupImpl = InputGroupFrame.styleable((props: any, forwardedRef: any) => {
  const { children, ...rest } = props;
  const [focused, setFocused] = useState(false);

  return (
    <FocusContext.Provider focused={focused} setFocused={setFocused}>
      <InputGroupFrame applyFocusStyle={focused} ref={forwardedRef} {...rest}>
        {children}
      </InputGroupFrame>
    </FocusContext.Provider>
  );
});

export const inputSizeVariant: SizeVariantSpreadFunction<any> = (
  val = "$true",
  extras,
) => {
  const paddingHorizontal = getSpace(val, {
    shift: -1,
    bounds: [2],
  });
  const fontStyle = getFontSized(val as any, extras);
  // lineHeight messes up input on native
  if (!isWeb && fontStyle) {
    delete fontStyle["lineHeight"];
  }
  return {
    ...fontStyle,
    height: val,
    borderRadius: 100_000,
    paddingHorizontal,
  };
};

const InputFrame = styled(TInput, {
  unstyled: true,
  context: InputContext,
});

// @ts-ignore Tamagui styleable render-fn typing friction under React 19 types
const InputImpl = InputFrame.styleable((props: any, ref: any) => {
  const { setFocused } = FocusContext.useStyledContext();
  const { size } = InputContext.useStyledContext();
  const { ...rest } = props;
  return (
    <View flex={1}>
      <InputFrame
        ref={ref}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        size={size as any}
        {...rest}
      />
    </View>
  );
});

const InputSection = styled(XGroup.Item, {
  context: InputContext,
});

const Button = styled(TButton, {
  context: InputContext,

  variants: {
    size: {
      "...size": (val = "$true", { tokens }) => {
        if (typeof val === "number") {
          return {
            paddingHorizontal: 0,
            height: val,
            borderRadius: val * 0.2,
          };
        }
        return {
          paddingHorizontal: 0,
          height: val,
        };
      },
    },
  } as const,
});

// Icon starts

export const InputIconFrame = styled(View, {
  context: InputContext,

  variants: {} as const,
});

const getIconSize = (size: FontSizeTokens, scale: number) => {
  return (
    (typeof size === "number"
      ? size * 0.5
      : getFontSize(size as FontSizeTokens)) * scale
  );
};

const InputIcon = InputIconFrame.styleable<{
  scaleIcon?: number;
  color?: ColorTokens | string;
  // @ts-ignore Tamagui styleable render-fn typing friction under React 19 types
}>((props: any, ref: any) => {
  const { children, color: colorProp, ...rest } = props;
  const inputContext = InputContext.useStyledContext();
  const { size = "$true", color: contextColor, scaleIcon = 1 } = inputContext;

  const theme = useTheme();
  const color = getVariable(
    contextColor ||
      theme[contextColor as any]?.get("web") ||
      theme.color10?.get("web"),
  );
  const iconSize = getIconSize(size as FontSizeTokens, scaleIcon);

  const getThemedIcon = useGetThemedIcon({
    size: iconSize,
    color: color as any,
  });
  return (
    <InputIconFrame ref={ref} {...rest}>
      {getThemedIcon(children)}
    </InputIconFrame>
  );
});

export const InputContainerFrame = styled(View, {
  context: InputContext,
  flexDirection: "column",

  variants: {
    size: {
      "...size": (val, { tokens }) => ({}),
    },
    color: {
      "...color": () => ({}),
    },
    gapScale: {
      ":number": {} as any,
    },
  } as const,

  defaultVariants: {
    size: "$4",
  },
});

export const InputLabel = styled(Label, {
  context: InputContext,
  variants: {
    size: {
      "...fontSize": getFontSized as any,
    },
  } as const,
});

export const InputInfo = styled(Text, {
  context: InputContext,
  color: "$color10",

  variants: {
    size: {
      "...fontSize": (val, { font }) => {
        if (!font) return;
        const fontSize = font.size[val].val * 0.8;
        const lineHeight = font.lineHeight?.[val].val * 0.8;
        const fontWeight = font.weight?.["$2"];
        const letterSpacing = font.letterSpacing?.[val];
        const textTransform = font.transform?.[val];
        const fontStyle = font.style?.[val];
        return {
          fontSize,
          lineHeight,
          fontWeight,
          letterSpacing,
          textTransform,
          fontStyle,
        };
      },
    },
  } as const,
});

const InputXGroup = styled(XGroup, {
  context: InputContext,

  variants: {} as const,
});

export const Input = withStaticProperties(InputContainerFrame, {
  Box: InputGroupImpl,
  Area: InputImpl,
  Section: InputSection,
  Button,
  Icon: InputIcon,
  Info: InputInfo,
  Label: InputLabel,
  XGroup: withStaticProperties(InputXGroup, { Item: XGroup.Item }),
});
// ─────────────────────────────────────────────────────────────────────────────
// AuthField — the field primitive used by the auth screens.
//
// A real form control: a label, an optional leading icon, a large 16px+ text input
// with a visible focus ring (accent), an optional trailing slot (e.g. show/hide), a
// helper line, and an inline error that replaces the helper when present. Designed for
// glare and low-end Android: 52px tap target, high-contrast text, no pill geometry.
// ─────────────────────────────────────────────────────────────────────────────

import type { NamedExoticComponent, ReactNode } from "react";
import { AlertCircle } from "@tamagui/lucide-icons";
import { Input as PlainInput, Spinner, XStack, YStack } from "tamagui";

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
    <YStack gap="$2">
      <Label
        htmlFor={inputId}
        fontSize="$3"
        fontWeight="700"
        color="$color11"
        m={0}
        p={0}
      >
        {label}
      </Label>

      <XStack
        items="center"
        gap="$2.5"
        height={52}
        px="$3.5"
        rounded="$5"
        bg="$color2"
        borderWidth={1}
        borderColor={invalid ? "$red8" : focused ? "$accent8" : "$borderColor"}
        {...(focused
          ? {
              outlineColor: invalid ? "$red8" : "$accent8",
              outlineWidth: 2,
              outlineStyle: "solid",
            }
          : null)}
        hoverStyle={{ borderColor: invalid ? "$red8" : "$borderColorHover" }}
        animation="quick"
      >
        {Icon ? (
          <Icon size={18} color={invalid ? "$red9" : "$color10"} />
        ) : null}
        <PlainInput
          id={inputId}
          flex={1}
          unstyled
          height="100%"
          fontSize="$5"
          color="$color12"
          placeholder={placeholder}
          placeholderTextColor="$color10"
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
      </XStack>

      {invalid ? (
        <XStack
          items="center"
          gap="$1.5"
          accessibilityLiveRegion="polite"
          aria-live="polite"
        >
          <AlertCircle size={16} color="$red10" />
          <Text id={`${inputId}-error`} fontSize="$3" color="$red11" flex={1}>
            {error}
          </Text>
        </XStack>
      ) : helper ? (
        <Text id={`${inputId}-helper`} fontSize="$3" color="$color11">
          {helper}
        </Text>
      ) : null}
    </YStack>
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
    <YStack gap="$2">
      <AuthFieldLabel htmlFor={inputId}>{label}</AuthFieldLabel>
      {children}
      {invalid ? (
        <XStack
          items="center"
          gap="$1.5"
          accessibilityLiveRegion="polite"
          aria-live="polite"
        >
          <AlertCircle size={16} color="$red10" />
          <Text id={`${inputId}-error`} fontSize="$3" color="$red11" flex={1}>
            {error}
          </Text>
        </XStack>
      ) : helper ? (
        <Text id={`${inputId}-helper`} fontSize="$3" color="$color11">
          {helper}
        </Text>
      ) : null}
    </YStack>
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
    <Label htmlFor={htmlFor} fontSize="$3" fontWeight="700" color="$color11" m={0}>
      {children}
    </Label>
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
    <Theme name="accent">
      <TButton
        height={52}
        rounded="$5"
        width="100%"
        bg="$color9"
        borderWidth={0}
        disabled={disabled || pending}
        opacity={disabled || pending ? 0.7 : 1}
        hoverStyle={{ bg: "$color10" }}
        pressStyle={{ bg: "$color8" }}
        onPress={onPress}
        focusStyle={{
          outlineColor: "$color8",
          outlineWidth: 2,
          outlineStyle: "solid",
        }}
        icon={
          pending ? (
            <Spinner color="$color1" />
          ) : Icon ? (
            <Icon size={18} color="$color1" />
          ) : undefined
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || pending, busy: pending }}
      >
        <TButton.Text fontSize="$5" fontWeight="800" color="$color1">
          {pending ? (pendingLabel ?? label) : label}
        </TButton.Text>
      </TButton>
    </Theme>
  );
}

/**
 * AuthError — a clear top-level error banner (error sub-theme). Announced to screen
 * readers on web (role=alert) and native (accessibilityLiveRegion=assertive).
 */
export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Theme name="error">
      <XStack
        items="center"
        gap="$2.5"
        p="$3"
        rounded="$5"
        bg="$color3"
        borderWidth={1}
        borderColor="$color6"
        role="alert"
        aria-live="assertive"
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <AlertCircle size={18} color="$color11" />
        <Text fontSize="$4" color="$color12" flex={1} fontWeight="600">
          {message}
        </Text>
      </XStack>
    </Theme>
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
