import { useMemo, useState } from "react";
import {
  Ambulance,
  Bed,
  BriefcaseMedical,
  ChevronRight,
  Search,
  Stethoscope,
  Wallet,
  X,
  C,
} from "@/components/ui/icons";
import { router, useLocalSearchParams } from "expo-router";
import type { ComponentType } from "react";
import { HStack, VStack, Text, Input, Pressable } from "@/components/ui/gs";
import type { Visit, VisitType } from "@/server/dto";
import {
  DLCard,
  DLScreen,
  DLStatusPill,
  DeptChips,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

// Visit type -> icon + Deltalab status colors. ER is the only attention type.
const TYPE_META: Record<
  VisitType,
  { Icon: ComponentType<{ size?: number; color?: string }>; text: string; softBg: string; hex: string }
> = {
  OPD: { Icon: BriefcaseMedical, text: "text-primary", softBg: "bg-primarySoft", hex: C.primary },
  IPD: { Icon: Bed, text: "text-primary", softBg: "bg-primarySoft", hex: C.primary },
  ER: { Icon: Ambulance, text: "text-bad", softBg: "bg-badSoft", hex: C.bad },
  OTHER: { Icon: Stethoscope, text: "text-text2", softBg: "bg-surface3", hex: C.text2 },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "OPD", label: "OPD" },
  { key: "IPD", label: "IPD" },
  { key: "ER", label: "ER" },
];

function doctorLine(v: Visit) {
  if (!v.doctor) return undefined;
  return [v.doctor.name, v.doctor.title].filter(Boolean).join(", ");
}

function VisitCard({ visit, onPress }: { visit: Visit; onPress: () => void }) {
  const meta = TYPE_META[visit.type] ?? TYPE_META.OTHER;
  const doc = doctorLine(visit);
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <DLCard className="p-[15px] gap-[12px]">
        <HStack className="items-center gap-[12px]">
          <VStack className={`w-[42px] h-[42px] rounded-[12px] items-center justify-center ${meta.softBg}`}>
            <meta.Icon size={20} color={meta.hex} />
          </VStack>
          <VStack className="flex-1 min-w-0 gap-[4px]">
            <HStack className="items-center gap-[7px]">
              <DLStatusPill label={visit.type} text={meta.text} softBg={meta.softBg} hex={meta.hex} size="sm" />
              <Text className="text-[15px] font-plex-bold text-fg flex-1" numberOfLines={1}>
                {visit.department ?? visit.typeLabel}
              </Text>
            </HStack>
            {visit.date ? (
              <Text className="text-[12px] text-text2">
                {visit.date.slice(0, 10)}
              </Text>
            ) : null}
          </VStack>
          <ChevronRight size={20} color={C.text3} />
        </HStack>

        {(doc || visit.paymentMethod) ? (
          <HStack className="items-center gap-[17px] pl-[54px] pt-[10px] border-t border-border flex-wrap">
            {doc ? (
              <HStack className="items-center gap-[4px] flex-1 min-w-[140px]">
                <Stethoscope size={13} color={C.text3} />
                <Text className="text-[12.5px] text-text2" numberOfLines={1}>
                  {doc}
                </Text>
              </HStack>
            ) : null}
            {visit.paymentMethod ? (
              <HStack className="items-center gap-[4px]">
                <Wallet size={13} color={C.text3} />
                <Text className="text-[12.5px] text-text2" numberOfLines={1}>
                  {visit.paymentMethod}
                </Text>
              </HStack>
            ) : null}
          </HStack>
        ) : null}
      </DLCard>
    </Pressable>
  );
}

export default function PatientVisits() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientVisits.useQuery();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Only offer filter chips for types the patient actually has.
  const chips = useMemo(() => {
    const present = new Set((data ?? []).map((v) => v.type));
    return FILTERS.filter((f) => f.key === "ALL" || present.has(f.key as VisitType));
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((v) => {
      if (filter !== "ALL" && v.type !== filter) return false;
      if (!q) return true;
      return [v.typeLabel, v.type, v.department, v.doctor?.name, v.doctor?.title, v.paymentMethod, v.date]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [data, filter, search]);

  return (
    <DLScreen>
      <DLTitle title="Visits" subtitle="Your appointments and admissions, newest first." />

      {isLoading ? (
        <SkeletonList count={5} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your visits"
          detail="Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={Stethoscope}
          title="No visits yet"
          detail="When you visit the hospital, your appointments and admissions will show up here."
        />
      ) : (
        <VStack className="gap-[15px]">
          <HStack className="items-center gap-[10px] pl-[15px] pr-[2px] h-[46px] rounded-[14px] bg-surface border border-border">
            <Search size={18} color={C.text3} />
            <Input
              className="flex-1 text-[14px] text-fg"
              placeholder="Search department, doctor, payment"
              placeholderTextColor={C.text3}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 ? (
              <Pressable
                className="w-[40px] h-[40px] items-center justify-center active:opacity-60"
                onPress={() => setSearch("")}
              >
                <X size={18} color={C.text3} />
              </Pressable>
            ) : null}
          </HStack>

          {chips.length > 2 ? <DeptChips items={chips} value={filter} onChange={setFilter} /> : null}

          {filtered.length === 0 ? (
            <EmptyState Icon={Search} title="No matching visits" detail="Try a different filter or clear your search." />
          ) : (
            <VStack className="gap-[10px]">
              {filtered.map((v) => (
                <VisitCard key={v.id} visit={v} onPress={() => router.push(`/patient/${uuid}/${v.id}` as any)} />
              ))}
            </VStack>
          )}
        </VStack>
      )}
    </DLScreen>
  );
}
