/**
 * Privacy / PII masking. By default the app hides personally-identifying values
 * (MRN, insurance number, phone) behind dots, like a bank app hiding a card number.
 * The patient can reveal them — globally (the header toggle) or per field (tap).
 *
 * This governs the app UI only. Hospital-generated PDFs/reports are out of scope.
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "privacy:revealAll";

interface PrivacyState {
  /** when true, all masked fields show their real value app-wide */
  revealAll: boolean;
  ready: boolean;
  setRevealAll: (v: boolean) => void;
  hydrate: () => void;
}

export const usePrivacy = create<PrivacyState>((set) => ({
  revealAll: false,
  ready: false,
  setRevealAll: (v) => {
    set({ revealAll: v });
    AsyncStorage.setItem(KEY, v ? "1" : "0").catch(() => {});
  },
  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      set({ revealAll: saved === "1", ready: true });
    } catch {
      set({ ready: true });
    }
  },
}));

export type PiiKind = "mrn" | "id" | "phone" | "generic";

/** Mask a value, keeping a small recognisable hint (prefix for MRN, last 3 chars). */
export function maskValue(value?: string, kind: PiiKind = "generic"): string {
  if (!value) return "—";
  const v = value.trim();
  if (v.length <= 3) return "•••";
  const tail = v.slice(-3);
  if (kind === "mrn") {
    const pre = v.match(/^[A-Za-z]+/)?.[0] ?? "";
    const dots = "•".repeat(Math.max(3, v.length - pre.length - 3));
    return `${pre}${dots}${tail}`;
  }
  return `${"•".repeat(Math.max(3, v.length - 3))}${tail}`;
}
