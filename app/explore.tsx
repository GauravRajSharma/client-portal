import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, BedDouble, Search, Stethoscope, UserRound } from "@tamagui/lucide-icons";
import { Input, Spinner, Text, XStack, YStack } from "tamagui";
import type { BedAvailability, PublicDoctor } from "@/server/dto";
import { DLCard, DLScreen, EmptyState } from "@/components/ui";
import { trpc } from "@/utils/trpc";

type Tab = "doctors" | "beds";

function TabButton({ active, label, Icon, onPress }: { active: boolean; label: string; Icon: any; onPress: () => void }) {
  return (
    <XStack
      flex={1}
      items="center"
      justify="center"
      gap="$2"
      height={42}
      rounded={12}
      bg={active ? "$primary" : "$surface"}
      borderWidth={1}
      borderColor={active ? "$primary" : "$border"}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
    >
      <Icon size={16} color={active ? "$onPrimary" : "$text2"} />
      <Text fontSize={13.5} fontWeight="700" color={active ? "$onPrimary" : "$text2"}>
        {label}
      </Text>
    </XStack>
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
    <XStack gap="$2" items="center">
      <XStack
        flex={1}
        items="center"
        gap="$2.5"
        pl="$3.5"
        height={46}
        rounded={14}
        bg="$surface"
        borderWidth={1}
        borderColor="$border"
        focusWithinStyle={{ borderColor: "$primary" }}
      >
        <Search size={18} color="$text3" />
        <Input
          flex={1}
          unstyled
          fontSize={14}
          color="$color12"
          placeholder={placeholder}
          placeholderTextColor="$text3"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </XStack>
      <XStack
        items="center"
        justify="center"
        height={46}
        px="$4"
        rounded={14}
        bg="$primary"
        opacity={busy ? 0.6 : 1}
        onPress={busy ? undefined : onSearch}
        pressStyle={{ bg: "$primaryStrong" }}
      >
        {busy ? <Spinner color="$onPrimary" /> : <Text fontSize={14} fontWeight="700" color="$onPrimary">Search</Text>}
      </XStack>
    </XStack>
  );
}

function DoctorResult({ doc, nameFor }: { doc: PublicDoctor; nameFor: (code: string) => string }) {
  return (
    <DLCard p="$3.5" gap="$2.5">
      <XStack items="center" gap="$3">
        <YStack width={40} height={40} rounded={11} bg="$primarySoft" items="center" justify="center">
          <UserRound size={20} color="$primary" />
        </YStack>
        <YStack flex={1} minW={0}>
          <Text fontSize={15.5} fontWeight="700" color="$color12" numberOfLines={1}>
            {doc.name}
          </Text>
          {doc.title ? (
            <Text fontSize={12.5} color="$text2" numberOfLines={1}>
              {doc.title}
            </Text>
          ) : null}
        </YStack>
        {doc.license ? (
          <YStack items="flex-end">
            <Text fontSize={10} color="$text3" fontWeight="600">
              NMC
            </Text>
            <Text fontSize={13} fontWeight="700" fontFamily="$mono" color="$color12">
              {doc.license}
            </Text>
          </YStack>
        ) : null}
      </XStack>
      <XStack gap="$2" flexWrap="wrap" pt="$1" borderTopWidth={1} borderColor="$border">
        {doc.hospitals.map((h) => (
          <XStack key={h} items="center" gap="$1.5" bg="$surface2" px="$2.5" py="$1.5" rounded={20} mt="$2">
            <Stethoscope size={12} color="$text2" />
            <Text fontSize={11.5} fontWeight="600" color="$text2">
              {nameFor(h)}
            </Text>
          </XStack>
        ))}
      </XStack>
    </DLCard>
  );
}

function BedResult({ row, nameFor }: { row: BedAvailability; nameFor: (code: string) => string }) {
  return (
    <DLCard p="$4" gap="$3">
      <XStack items="center" justify="space-between" gap="$3">
        <XStack items="center" gap="$2.5" flex={1} minW={0}>
          <YStack width={38} height={38} rounded={10} bg="$primarySoft" items="center" justify="center">
            <BedDouble size={18} color="$primary" />
          </YStack>
          <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={1} flex={1}>
            {nameFor(row.hospital)}
          </Text>
        </XStack>
        <YStack items="flex-end">
          <Text fontSize={18} fontWeight="700" fontFamily="$mono" color={row.free > 0 ? "$good" : "$bad"}>
            {row.free}
          </Text>
          <Text fontSize={10.5} color="$text2">
            free of {row.total}
          </Text>
        </YStack>
      </XStack>
      <YStack gap="$1.5" pt="$2.5" borderTopWidth={1} borderColor="$border">
        {row.types.map((t) => (
          <XStack key={t.type} items="center" justify="space-between">
            <Text fontSize={13} color="$color12" flex={1} numberOfLines={1}>
              {t.type}
            </Text>
            <XStack items="center" gap="$2">
              <Text fontSize={12.5} fontWeight="700" color={t.free > 0 ? "$good" : "$text3"} fontFamily="$mono">
                {t.free} free
              </Text>
              <Text fontSize={11.5} color="$text3" fontFamily="$mono">
                / {t.total}
              </Text>
            </XStack>
          </XStack>
        ))}
      </YStack>
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
      <XStack items="center" gap="$2" self="flex-start" onPress={() => router.replace("/auth/login" as any)} pressStyle={{ opacity: 0.6 }}>
        <ArrowLeft size={18} color="$text2" />
        <Text fontSize={14} fontWeight="500" color="$text2">
          Sign in
        </Text>
      </XStack>

      <YStack px="$0.5" gap="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Find a doctor or bed
        </Text>
        <Text fontSize={13} color="$text2">
          Search across our hospitals. No login needed.
        </Text>
      </YStack>

      <XStack gap="$2">
        <TabButton active={tab === "doctors"} label="Doctors" Icon={Stethoscope} onPress={() => switchTab("doctors")} />
        <TabButton active={tab === "beds"} label="Beds" Icon={BedDouble} onPress={() => switchTab("beds")} />
      </XStack>

      <SearchBar
        value={q}
        onChange={setQ}
        onSearch={runSearch}
        busy={busy}
        placeholder={tab === "doctors" ? "Doctor name or NMC number" : "Bed type (optional), then Search"}
      />

      {error ? (
        <Text fontSize={12.5} color="$bad" px="$1">
          {error}
        </Text>
      ) : null}

      {busy ? (
        <YStack items="center" py="$8">
          <Spinner size="large" color="$primary" />
          <Text fontSize={12.5} color="$text2" mt="$3">
            Searching across hospitals…
          </Text>
        </YStack>
      ) : tab === "doctors" ? (
        docs === null ? (
          <EmptyState Icon={Stethoscope} title="Search for a doctor" detail="Type a name or NMC number, then tap Search. We only show name, NMC number, title, and hospital." />
        ) : docs.length === 0 ? (
          <EmptyState Icon={Search} title="No doctors found" detail="Try a different name or NMC number." />
        ) : (
          <YStack gap="$2.5">
            {docs.map((d, i) => (
              <DoctorResult key={`${d.license ?? d.name}-${i}`} doc={d} nameFor={nameFor} />
            ))}
          </YStack>
        )
      ) : beds === null ? (
        <EmptyState Icon={BedDouble} title="Check bed availability" detail="Tap Search to see free beds by type across our hospitals, or filter by a bed type." />
      ) : beds.length === 0 ? (
        <EmptyState Icon={Search} title="No bed data" detail="No matching bed information is available right now." />
      ) : (
        <YStack gap="$2.5">
          {beds.map((b) => (
            <BedResult key={b.hospital} row={b} nameFor={nameFor} />
          ))}
        </YStack>
      )}

      <Text fontSize={11} color="$text3" text="center" px="$4" pt="$2">
        Public information, refreshed periodically. No patient details are shown.
      </Text>
    </DLScreen>
  );
}
