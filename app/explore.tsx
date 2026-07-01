import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, BedDouble, Search, Stethoscope, UserRound } from "lucide-react-native";
import type { BedAvailability, PublicDoctor } from "@/server/dto";
import { DLCard, DLScreen, EmptyState } from "@/components/ui";
import { HStack, VStack, Text, Pressable, Input, Spinner } from "@/components/ui/gs";
import { trpc } from "@/utils/trpc";

type Tab = "doctors" | "beds";

// ponytail: lucide-react-native takes a hex color prop (not NativeWind classes).
// These are the light-theme token values; dark-mode icon tinting is a follow-up
// (wire useColorScheme or cssInterop) — glyph color is the only thing not themed.
const C = {
  primary: "#0b4ea0",
  onPrimary: "#ffffff",
  text2: "#46566a",
  text3: "#7c8b9e",
  good: "#1f9d6b",
  bad: "#d6453d",
};

function TabButton({ active, label, Icon, onPress }: { active: boolean; label: string; Icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row flex-1 items-center justify-center gap-2 h-[42px] rounded-[12px] border active:opacity-80 ${
        active ? "bg-primary border-primary" : "bg-surface border-border"
      }`}
    >
      <Icon size={16} color={active ? C.onPrimary : C.text2} />
      <Text className={`text-[13.5px] font-plex-bold ${active ? "text-onPrimary" : "text-text2"}`}>{label}</Text>
    </Pressable>
  );
}

function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  busy,
}: {
  value: string;
  onChange: (s: string) => void;
  onSearch: () => void;
  placeholder: string;
  busy: boolean;
}) {
  return (
    <HStack className="gap-2 items-center">
      <HStack className="flex-1 items-center gap-2.5 pl-3.5 h-[46px] rounded-[14px] bg-surface border border-border focus-within:border-primary">
        <Search size={18} color={C.text3} />
        <Input
          className="flex-1 text-[14px] text-fg"
          placeholder={placeholder}
          placeholderTextColor={C.text3}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </HStack>
      <Pressable
        onPress={busy ? undefined : onSearch}
        className={`items-center justify-center h-[46px] px-4 rounded-[14px] bg-primary active:bg-primaryStrong ${busy ? "opacity-60" : ""}`}
      >
        {busy ? <Spinner color={C.onPrimary} /> : <Text className="text-[14px] font-plex-bold text-onPrimary">Search</Text>}
      </Pressable>
    </HStack>
  );
}

function DoctorResult({ doc, nameFor }: { doc: PublicDoctor; nameFor: (code: string) => string }) {
  return (
    <DLCard p="$3.5" gap="$2.5">
      <HStack className="items-center gap-3">
        <VStack className="w-[40px] h-[40px] rounded-[11px] bg-primarySoft items-center justify-center">
          <UserRound size={20} color={C.primary} />
        </VStack>
        <VStack className="flex-1 min-w-0">
          <Text className="text-[15.5px] font-plex-bold text-fg" numberOfLines={1}>
            {doc.name}
          </Text>
          {doc.title ? (
            <Text className="text-[12.5px] text-text2" numberOfLines={1}>
              {doc.title}
            </Text>
          ) : null}
        </VStack>
        {doc.license ? (
          <VStack className="items-end">
            <Text className="text-[10px] text-text3 font-plex-semibold">NMC</Text>
            <Text className="text-[13px] font-plex-bold font-plex-mono text-fg">{doc.license}</Text>
          </VStack>
        ) : null}
      </HStack>
      <HStack className="gap-2 flex-wrap pt-1 border-t border-border">
        {doc.hospitals.map((h) => (
          <HStack key={h} className="items-center gap-1.5 bg-surface2 px-2.5 py-1.5 rounded-[20px] mt-2">
            <Stethoscope size={12} color={C.text2} />
            <Text className="text-[11.5px] font-plex-semibold text-text2">{nameFor(h)}</Text>
          </HStack>
        ))}
      </HStack>
    </DLCard>
  );
}

function BedResult({ row, nameFor }: { row: BedAvailability; nameFor: (code: string) => string }) {
  return (
    <DLCard p="$4" gap="$3">
      <HStack className="items-center justify-between gap-3">
        <HStack className="items-center gap-2.5 flex-1 min-w-0">
          <VStack className="w-[38px] h-[38px] rounded-[10px] bg-primarySoft items-center justify-center">
            <BedDouble size={18} color={C.primary} />
          </VStack>
          <Text className="text-[15px] font-plex-bold text-fg flex-1" numberOfLines={1}>
            {nameFor(row.hospital)}
          </Text>
        </HStack>
        <VStack className="items-end">
          <Text className={`text-[18px] font-plex-bold font-plex-mono ${row.free > 0 ? "text-good" : "text-bad"}`}>{row.free}</Text>
          <Text className="text-[10.5px] text-text2">free of {row.total}</Text>
        </VStack>
      </HStack>
      <VStack className="gap-1.5 pt-2.5 border-t border-border">
        {row.types.map((t) => (
          <HStack key={t.type} className="items-center justify-between">
            <Text className="text-[13px] text-fg flex-1" numberOfLines={1}>
              {t.type}
            </Text>
            <HStack className="items-center gap-2">
              <Text className={`text-[12.5px] font-plex-bold font-plex-mono ${t.free > 0 ? "text-good" : "text-text3"}`}>{t.free} free</Text>
              <Text className="text-[11.5px] text-text3 font-plex-mono">/ {t.total}</Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </DLCard>
  );
}

export default function Explore() {
  const [tab, setTab] = useState<Tab>("doctors");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<PublicDoctor[] | null>(null);
  const [beds, setBeds] = useState<BedAvailability[] | null>(null);

  const utils = trpc.useUtils();
  const hospitalsQ = trpc.hospitals.useQuery();
  const nameFor = useMemo(() => {
    const m = new Map((hospitalsQ.data ?? []).map((h: any) => [h.hospital?.prefix, h.name]));
    return (code: string) => m.get(code) ?? code;
  }, [hospitalsQ.data]);

  const runSearch = async () => {
    setError(null);
    if (tab === "doctors" && q.trim().length < 2) {
      setError("Enter at least 2 characters (name or NMC number).");
      return;
    }
    setBusy(true);
    try {
      if (tab === "doctors") {
        setDocs(await utils.publicDoctorSearch.fetch({ q: q.trim() }));
      } else {
        setBeds(await utils.publicBedAvailability.fetch({ q: q.trim() || undefined }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setQ("");
  };

  return (
    <DLScreen maxWidth={620}>
      <Pressable onPress={() => router.replace("/auth/login" as any)} className="flex-row items-center gap-2 self-start active:opacity-60">
        <ArrowLeft size={18} color={C.text2} />
        <Text className="text-[14px] font-plex-medium text-text2">Sign in</Text>
      </Pressable>

      <VStack className="px-0.5 gap-1">
        <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px]">Find a doctor or bed</Text>
        <Text className="text-[13px] text-text2">Search across our hospitals. No login needed.</Text>
      </VStack>

      <HStack className="gap-2">
        <TabButton active={tab === "doctors"} label="Doctors" Icon={Stethoscope} onPress={() => switchTab("doctors")} />
        <TabButton active={tab === "beds"} label="Beds" Icon={BedDouble} onPress={() => switchTab("beds")} />
      </HStack>

      <SearchBar
        value={q}
        onChange={setQ}
        onSearch={runSearch}
        busy={busy}
        placeholder={tab === "doctors" ? "Doctor name or NMC number" : "Bed type (optional), then Search"}
      />

      {error ? <Text className="text-[12.5px] text-bad px-1">{error}</Text> : null}

      {busy ? (
        <VStack className="items-center py-8">
          <Spinner size="large" color={C.primary} />
          <Text className="text-[12.5px] text-text2 mt-3">Searching across hospitals…</Text>
        </VStack>
      ) : tab === "doctors" ? (
        docs === null ? (
          <EmptyState Icon={Stethoscope} title="Search for a doctor" detail="Type a name or NMC number, then tap Search. We only show name, NMC number, title, and hospital." />
        ) : docs.length === 0 ? (
          <EmptyState Icon={Search} title="No doctors found" detail="Try a different name or NMC number." />
        ) : (
          <VStack className="gap-2.5">
            {docs.map((d, i) => (
              <DoctorResult key={`${d.license ?? d.name}-${i}`} doc={d} nameFor={nameFor} />
            ))}
          </VStack>
        )
      ) : beds === null ? (
        <EmptyState Icon={BedDouble} title="Check bed availability" detail="Tap Search to see free beds by type across our hospitals, or filter by a bed type." />
      ) : beds.length === 0 ? (
        <EmptyState Icon={Search} title="No bed data" detail="No matching bed information is available right now." />
      ) : (
        <VStack className="gap-2.5">
          {beds.map((b) => (
            <BedResult key={b.hospital} row={b} nameFor={nameFor} />
          ))}
        </VStack>
      )}

      <Text className="text-[11px] text-text3 text-center px-4 pt-2">Public information, refreshed periodically. No patient details are shown.</Text>
    </DLScreen>
  );
}
