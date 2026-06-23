/**
 * Lightweight i18n for the patient portal.
 *
 * Design goals:
 *  - Tiny and dependency-free beyond zustand (already a dep) + AsyncStorage.
 *  - Reusable: any screen imports { useT, useLang, t } and reads from one dictionary.
 *  - Persistent: the chosen language survives app restarts (AsyncStorage).
 *  - Safe: an unknown key falls back to its English string, then to the key itself,
 *    so a missing translation never renders blank.
 *
 * Scope note: only the Profile screen and the NavShell labels are translated today.
 * App-wide translation of every screen is a deliberate follow-up (see PR body) so the
 * helper can be adopted screen by screen without a big-bang rewrite.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { create } from "zustand";

export type Lang = "en" | "ne";

const STORAGE_KEY = "pref:lang";

/** Every translatable string the portal uses today, keyed by a stable id. */
const DICT = {
  // Language toggle
  "lang.english": { en: "English", ne: "English" },
  "lang.nepali": { en: "नेपाली", ne: "नेपाली" },
  "lang.label": { en: "Language", ne: "भाषा" },

  // NavShell labels
  "nav.home": { en: "Home", ne: "गृह" },
  "nav.visits": { en: "Visits", ne: "भ्रमण" },
  "nav.results": { en: "Results", ne: "नतिजा" },
  "nav.meds": { en: "Medicines", ne: "औषधि" },
  "nav.profile": { en: "Profile", ne: "प्रोफाइल" },

  // Profile screen
  "profile.title": { en: "Profile", ne: "प्रोफाइल" },
  "profile.viewOnly.title": { en: "Safe to view", ne: "हेर्न सुरक्षित" },
  "profile.viewOnly.detail": {
    en: "You can only view your records here. This app never changes your medical record.",
    ne: "तपाईं यहाँ आफ्नो विवरण हेर्न मात्र सक्नुहुन्छ। यो एपले तपाईंको मेडिकल रेकर्ड कहिल्यै बदल्दैन।",
  },
  "profile.details": { en: "Your details", ne: "तपाईंको विवरण" },
  "profile.field.mrn": { en: "Medical Record Number", ne: "मेडिकल रेकर्ड नम्बर" },
  "profile.field.insurance": {
    en: "Insurance (NHIS) number",
    ne: "बीमा (NHIS) नम्बर",
  },
  "profile.field.phone": { en: "Phone", ne: "फोन" },
  "profile.hospital": { en: "Hospital", ne: "अस्पताल" },
  "profile.field.hospitalName": { en: "Facility", ne: "स्वास्थ्य संस्था" },
  "profile.notProvided": { en: "Not on record", ne: "रेकर्डमा छैन" },
  "profile.signOut": { en: "Sign out", ne: "साइन आउट" },
  "profile.signOut.confirm": {
    en: "Sign out of EHRPlus?",
    ne: "EHRPlus बाट साइन आउट गर्ने?",
  },
  "profile.signOut.detail": {
    en: "To sign in again you will need your hospital, your MRN, and to verify your insurance or mobile number.",
    ne: "फेरि साइन इन गर्न तपाईंलाई आफ्नो अस्पताल, MRN, र बीमा वा मोबाइल नम्बरबाट पुष्टि गर्नुपर्नेछ।",
  },
  "profile.signOut.cancel": { en: "Cancel", ne: "रद्द गर्नुहोस्" },

  // Shared states
  "state.error.title": {
    en: "Could not load your profile",
    ne: "प्रोफाइल लोड हुन सकेन",
  },
  "state.error.detail": {
    en: "Please check your connection and try again.",
    ne: "कृपया आफ्नो इन्टरनेट जाँच गरी फेरि प्रयास गर्नुहोस्।",
  },
  "state.retry": { en: "Try again", ne: "फेरि प्रयास गर्नुहोस्" },
} as const;

export type TKey = keyof typeof DICT;

interface LangState {
  lang: Lang;
  ready: boolean;
  setLang: (lang: Lang) => void;
  hydrate: () => Promise<void>;
}

/**
 * One store, one source of truth for the active language. Defaults to English and
 * hydrates the saved preference on first mount (see useLang).
 */
export const useLangStore = create<LangState>((set) => ({
  lang: "en",
  ready: false,
  setLang: (lang) => {
    set({ lang });
    // Fire-and-forget persistence; a failed write should never block the UI.
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  },
  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ne") set({ lang: saved, ready: true });
      else set({ ready: true });
    } catch {
      set({ ready: true });
    }
  },
}));

/** Pure lookup. `lang` defaults to English so non-hook callers still resolve. */
export function t(key: TKey, lang: Lang = "en"): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}

/**
 * useLang — read/set the active language. Hydrates the persisted choice once.
 * Returns { lang, setLang, ready, toggle }.
 */
export function useLang() {
  const lang = useLangStore((s) => s.lang);
  const ready = useLangStore((s) => s.ready);
  const setLang = useLangStore((s) => s.setLang);
  const hydrate = useLangStore((s) => s.hydrate);

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  return {
    lang,
    ready,
    setLang,
    toggle: () => setLang(lang === "en" ? "ne" : "en"),
  };
}

/**
 * useT — the translator bound to the active language. `const T = useT(); T("nav.home")`.
 * This is the idiomatic way for a component to localize; it re-renders on language change.
 */
export function useT() {
  const { lang } = useLang();
  return (key: TKey) => t(key, lang);
}
