import { Text, XStack, YStack } from "tamagui";
import type { Patient } from "@/server/dto";

/** Initials avatar — no photos in the system; derive calm initials from the name. */
export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";
  return (
    <YStack
      width={size}
      height={size}
      rounded="$10"
      bg="$color4"
      items="center"
      justify="center"
    >
      <Text fontSize={size * 0.36} fontWeight="800" color="$color11">
        {initials}
      </Text>
    </YStack>
  );
}

/** IdentityChip — who am I / which hospital. Used in header and profile. */
export function IdentityChip({
  patient,
  compact = false,
}: {
  patient?: Pick<Patient, "name" | "mrn" | "hospital">;
  compact?: boolean;
}) {
  return (
    <XStack items="center" gap="$2.5">
      <Avatar name={patient?.name} size={compact ? 36 : 44} />
      <YStack gap="$0.5" flex={1}>
        <Text fontSize={compact ? "$4" : "$5"} fontWeight="700" color="$color12" numberOfLines={1}>
          {patient?.name ?? "—"}
        </Text>
        <Text fontSize="$2" color="$color9" numberOfLines={1}>
          {[patient?.mrn, patient?.hospital?.name].filter(Boolean).join(" · ")}
        </Text>
      </YStack>
    </XStack>
  );
}

/** DateText — formats a loose/ISO date string for patients. Safe on bad input. */
export function DateText({
  value,
  fallback = "—",
  ...rest
}: {
  value?: string;
  fallback?: string;
  [k: string]: any;
}) {
  let label = fallback;
  if (value) {
    const d = new Date(value);
    label = Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return (
    <Text fontSize="$3" color="$color10" {...rest}>
      {label}
    </Text>
  );
}
