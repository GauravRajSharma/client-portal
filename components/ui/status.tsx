import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Check,
  Minus,
} from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import type { LabStatus } from "@/server/dto";

type ThemeName = "success" | "warning" | "error" | "accent" | "neutral";

export interface StatusMeta {
  label: string;
  /** Tamagui sub-theme to wrap with, or "neutral" for the base theme. */
  theme: ThemeName;
  Icon: NamedExoticComponent<any>;
  /** true when the value is outside the reference range (worth the patient's notice) */
  attention: boolean;
}

/**
 * Single source of truth for how a lab status looks and reads. Plain language first
 * (a patient is not a clinician), color/icon second. See DESIGN.md → color severity.
 */
export function labStatusMeta(status: LabStatus): StatusMeta {
  switch (status) {
    case "normal":
      return { label: "Normal", theme: "success", Icon: Check, attention: false };
    case "low":
      return { label: "Low", theme: "accent", Icon: ArrowDown, attention: true };
    case "high":
      return { label: "High", theme: "warning", Icon: ArrowUp, attention: true };
    case "critical-low":
      return { label: "Very low", theme: "error", Icon: ChevronsDown, attention: true };
    case "critical-high":
      return { label: "Very high", theme: "error", Icon: ChevronsUp, attention: true };
    default:
      return { label: "—", theme: "neutral", Icon: Minus, attention: false };
  }
}
