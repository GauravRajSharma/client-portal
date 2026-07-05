import { HStack, VStack, Text } from "./gs";
import type { Patient } from "@/server/dto";

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

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
    <VStack className="rounded-full bg-surface3 items-center justify-center" style={{ width: size, height: size }}>
      <Text className="font-plex-bold text-fg" style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </VStack>
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
    <HStack className="items-center gap-[10px]">
      <Avatar name={patient?.name} size={compact ? 36 : 44} />
      <VStack className="gap-[1px] flex-1">
        <Text className={cx("font-plex-bold text-fg", compact ? "text-[15px]" : "text-[17px]")} numberOfLines={1}>
          {patient?.name ?? "—"}
        </Text>
        <Text className="text-[12px] text-text3" numberOfLines={1}>
          {[patient?.mrn, patient?.hospital?.name].filter(Boolean).join(" · ")}
        </Text>
      </VStack>
    </HStack>
  );
}

/** DateText — formats a loose/ISO date string for patients. Safe on bad input. */
export function DateText({
  value,
  fallback = "—",
  className,
  ...rest
}: {
  value?: string;
  fallback?: string;
  className?: string;
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
    <Text className={cx("text-[13px] text-text3", className)} {...rest}>
      {label}
    </Text>
  );
}
