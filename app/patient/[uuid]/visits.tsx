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
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { NamedExoticComponent } from "react";
import { Input, Text, XStack, YStack } from "tamagui";
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
  { Icon: NamedExoticComponent<any>; color: any; soft: any }
> = {
  OPD: { Icon: BriefcaseMedical, color: "$primary", soft: "$primarySoft" },
  IPD: { Icon: Bed, color: "$primary", soft: "$primarySoft" },
  ER: { Icon: Ambulance, color: "$bad", soft: "$badSoft" },
  OTHER: { Icon: Stethoscope, color: "$text2", soft: "$surface3" },
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
    <DLCard p="$3.5" gap="$3" onPress={onPress} pressStyle={{ opacity: 0.7 }}>
      <XStack items="center" gap="$3">
        <YStack width={42} height={42} rounded={12} bg={meta.soft} items="center" justify="center">
          <meta.Icon size={20} color={meta.color} />
        </YStack>
        <YStack flex={1} minW={0} gap="$1.5">
          <XStack items="center" gap="$2">
            <DLStatusPill label={visit.type} color={meta.color} soft={meta.soft} size="sm" />
            <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={1} flex={1}>
              {visit.department ?? visit.typeLabel}
            </Text>
          </XStack>
          {visit.date ? (
            <Text fontSize={12} color="$text2">
              {visit.date.slice(0, 10)}
            </Text>
          ) : null}
        </YStack>
        <ChevronRight size={20} color="$text3" />
      </XStack>

      {(doc || visit.paymentMethod) ? (
        <XStack
          items="center"
          gap="$4"
          pl={54}
          pt="$2.5"
          borderTopWidth={1}
          borderColor="$border"
          flexWrap="wrap"
        >
          {doc ? (
            <XStack items="center" gap="$1.5" flex={1} minW={140}>
              <Stethoscope size={13} color="$text3" />
              <Text fontSize={12.5} color="$text2" numberOfLines={1}>
                {doc}
              </Text>
            </XStack>
          ) : null}
          {visit.paymentMethod ? (
            <XStack items="center" gap="$1.5">
              <Wallet size={13} color="$text3" />
              <Text fontSize={12.5} color="$text2" numberOfLines={1}>
                {visit.paymentMethod}
              </Text>
            </XStack>
          ) : null}
        </XStack>
      ) : null}
    </DLCard>
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
        <YStack gap="$3.5">
          <XStack
            items="center"
            gap="$2.5"
            pl="$3.5"
            pr="$1"
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
              placeholder="Search department, doctor, payment"
              placeholderTextColor="$text3"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 ? (
              <XStack width={40} height={40} items="center" justify="center" onPress={() => setSearch("")} pressStyle={{ opacity: 0.6 }}>
                <X size={18} color="$text3" />
              </XStack>
            ) : null}
          </XStack>

          {chips.length > 2 ? <DeptChips items={chips} value={filter} onChange={setFilter} /> : null}

          {filtered.length === 0 ? (
            <EmptyState Icon={Search} title="No matching visits" detail="Try a different filter or clear your search." />
          ) : (
            <YStack gap="$2.5">
              {filtered.map((v) => (
                <VisitCard key={v.id} visit={v} onPress={() => router.push(`/patient/${uuid}/${v.id}` as any)} />
              ))}
            </YStack>
          )}
        </YStack>
      )}
    </DLScreen>
  );
}
