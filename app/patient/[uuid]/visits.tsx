import {
  DateText,
  EmptyState,
  ErrorState,
  IdentityChip,
  Panel,
  Screen,
  Section,
  SkeletonList,
  StatusPill,
} from "@/components/ui";
import type { Visit, VisitType } from "@/server/dto";
import { trpc } from "@/utils/trpc";
import {
  Ambulance,
  Bed,
  BriefcaseMedical,
  ChevronRight,
  Pill,
  Search,
  Stethoscope,
  Wallet,
  X,
} from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Input, Text, Theme, XStack, YStack, useMedia } from "tamagui";

const TYPE_ICON: Record<VisitType, typeof BriefcaseMedical> = {
  OPD: BriefcaseMedical,
  IPD: Bed,
  ER: Ambulance,
  OTHER: Stethoscope,
};

// ER is the only type that warrants an attention color; the rest stay calm/neutral.
const TYPE_THEME: Record<VisitType, "neutral" | "error"> = {
  OPD: "neutral",
  IPD: "neutral",
  ER: "error",
  OTHER: "neutral",
};

type Filter = "ALL" | VisitType;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPD", label: "OPD" },
  { key: "IPD", label: "IPD" },
  { key: "ER", label: "ER" },
];

function doctorLine(visit: Visit): string | undefined {
  if (!visit.doctor) return undefined;
  return [visit.doctor.name, visit.doctor.title].filter(Boolean).join(", ");
}

/** Dense table row for web (>= md). Columns align across rows for fast scanning. */
function VisitTableRow({ visit }: { visit: Visit }) {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const Icon = TYPE_ICON[visit.type] ?? Stethoscope;
  const doc = doctorLine(visit);
  return (
    <XStack
      items="center"
      gap="$3"
      px="$3"
      py="$3"
      borderBottomWidth={1}
      borderColor="$borderColor"
      cursor="pointer"
      hoverStyle={{ bg: "$color2" }}
      pressStyle={{ bg: "$color3" }}
      animation="quick"
      accessibilityRole="button"
      accessibilityLabel={`${visit.typeLabel} visit${
        visit.department ? `, ${visit.department}` : ""
      }`}
      onPress={() => router.push(`/patient/${uuid}/${visit.id}` as any)}
    >
      <XStack width={86} items="center" gap="$2">
        <Icon size={16} color="$color10" />
        <StatusPill
          label={visit.type}
          theme={TYPE_THEME[visit.type]}
          size="sm"
        />
      </XStack>
      <Text
        flex={2}
        fontSize="$4"
        fontWeight="600"
        color="$color12"
        numberOfLines={1}
      >
        {visit.department ?? visit.typeLabel}
      </Text>
      <DateText
        value={visit.date}
        flex={1}
        fontSize="$3"
        color="$color10"
        numberOfLines={1}
      />
      <Text flex={2} fontSize="$3" color="$color10" numberOfLines={1}>
        {doc ?? "—"}
      </Text>
      <Text flex={1.5} fontSize="$3" color="$color10" numberOfLines={1}>
        {visit.paymentMethod ?? "—"}
      </Text>
      <ChevronRight size={18} color="$color8" />
    </XStack>
  );
}

function VisitTable({ visits }: { visits: Visit[] }) {
  return (
    <YStack
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$6"
      overflow="hidden"
      bg="$color1"
    >
      <XStack
        items="center"
        gap="$3"
        px="$3"
        py="$2.5"
        bg="$color2"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Text width={86} fontSize="$1" fontWeight="700" color="$color9">
          TYPE
        </Text>
        <Text flex={2} fontSize="$1" fontWeight="700" color="$color9">
          DEPARTMENT
        </Text>
        <Text flex={1} fontSize="$1" fontWeight="700" color="$color9">
          DATE
        </Text>
        <Text flex={2} fontSize="$1" fontWeight="700" color="$color9">
          DOCTOR
        </Text>
        <Text flex={1.5} fontSize="$1" fontWeight="700" color="$color9">
          PAYMENT
        </Text>
        <YStack width={18} />
      </XStack>
      {visits.map((v, i) => (
        <YStack
          key={v.id}
          {...(i === visits.length - 1 ? { borderBottomWidth: 0 } : {})}
        >
          <VisitTableRow visit={v} />
        </YStack>
      ))}
    </YStack>
  );
}

/** One scannable visit row (mobile): type pill first, then department, date, doctor, payment. */
function VisitRow({ visit }: { visit: Visit }) {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const Icon = TYPE_ICON[visit.type] ?? Stethoscope;
  const doc = doctorLine(visit);

  return (
    <Panel
      p="$3.5"
      gap="$2.5"
      cursor="pointer"
      pressStyle={{ bg: "$color2" }}
      hoverStyle={{ borderColor: "$color7" }}
      animation="quick"
      accessibilityRole="button"
      accessibilityLabel={`${visit.typeLabel} visit${
        visit.department ? `, ${visit.department}` : ""
      }`}
      onPress={() => router.push(`/patient/${uuid}/${visit.id}` as any)}
    >
      <XStack items="center" gap="$3">
        <YStack
          width={40}
          height={40}
          rounded="$5"
          bg="$color3"
          items="center"
          justify="center"
        >
          <Icon size={20} color="$color11" />
        </YStack>
        <YStack flex={1} gap="$1">
          <XStack items="center" gap="$2" flexWrap="wrap">
            <StatusPill
              label={visit.type}
              theme={TYPE_THEME[visit.type]}
              size="sm"
            />
            <Text
              fontSize="$5"
              fontWeight="700"
              color="$color12"
              numberOfLines={1}
              flex={1}
            >
              {visit.department ?? visit.typeLabel}
            </Text>
          </XStack>
          <DateText value={visit.date} fontSize="$2" color="$color9" />
        </YStack>
        <ChevronRight size={20} color="$color8" />
      </XStack>

      {(doc || visit.paymentMethod) && (
        <XStack items="center" justify="space-between" gap="$3" pl={52}>
          {doc ? (
            <XStack items="center" gap="$1.5" flex={1}>
              <Stethoscope size={13} color="$color9" />
              <Text fontSize="$2" color="$color10" numberOfLines={1}>
                {doc}
              </Text>
            </XStack>
          ) : (
            <YStack flex={1} />
          )}
          {visit.paymentMethod ? (
            <XStack items="center" gap="$1.5">
              <Wallet size={13} color="$color9" />
              <Text fontSize="$2" color="$color10" numberOfLines={1}>
                {visit.paymentMethod}
              </Text>
            </XStack>
          ) : null}
        </XStack>
      )}
    </Panel>
  );
}

/** Filter + count summary chips. Selecting filters by visit type; counts teach scale. */
function FilterBar({
  value,
  onChange,
  counts,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Record<Filter, number>;
}) {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {FILTERS.map((f) => {
        const active = f.key === value;
        const n = counts[f.key] ?? 0;
        const disabled = f.key !== "ALL" && n === 0;
        const chip = (
          <XStack
            key={f.key}
            items="center"
            gap="$1.5"
            px="$3.5"
            height={40}
            rounded="$10"
            bg={active ? "$accent9" : "$color2"}
            borderWidth={1}
            borderColor={active ? "$accent9" : "$borderColor"}
            opacity={disabled ? 0.45 : 1}
            cursor={disabled ? "default" : "pointer"}
            pressStyle={disabled ? undefined : { opacity: 0.8 }}
            hoverStyle={disabled || active ? undefined : { bg: "$color3" }}
            animation="quick"
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={`${f.label} visits, ${n}`}
            onPress={() => !disabled && onChange(f.key)}
          >
            <Text
              fontSize="$3"
              fontWeight="700"
              color={active ? "#fff" : "$color11"}
            >
              {f.label}
            </Text>
            <Text
              fontSize="$2"
              fontWeight="600"
              color={active ? "$accent4" : "$color9"}
            >
              {n}
            </Text>
          </XStack>
        );
        return active ? (
          <Theme key={f.key} name="accent">
            {chip}
          </Theme>
        ) : (
          chip
        );
      })}
    </XStack>
  );
}

function VisitList() {
  const media = useMedia();
  const { data, isLoading, isError, refetch } = trpc.patientVisits.useQuery();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      ALL: 0,
      OPD: 0,
      IPD: 0,
      ER: 0,
      OTHER: 0,
    };
    for (const v of data ?? []) {
      base.ALL += 1;
      base[v.type] = (base[v.type] ?? 0) + 1;
    }
    return base;
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((v) => {
      if (filter !== "ALL" && v.type !== filter) return false;
      if (!q) return true;
      return [
        v.typeLabel,
        v.type,
        v.department,
        v.doctor?.name,
        v.doctor?.title,
        v.paymentMethod,
        v.date,
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [data, filter, search]);

  if (isLoading) return <SkeletonList count={5} />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your visits"
        detail="Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        Icon={Stethoscope}
        title="No visits yet"
        detail="When you visit the hospital, your appointments and admissions will show up here."
      />
    );
  }

  return (
    <YStack gap="$4">
      <YStack gap="$3">
        <XStack
          items="center"
          gap="$2.5"
          pl="$3"
          pr="$1"
          height={48}
          rounded="$6"
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          focusWithinStyle={{ borderColor: "$accent8" }}
        >
          <Search size={18} color="$color9" />
          <Input
            flex={1}
            unstyled
            fontSize="$4"
            color="$color12"
            placeholder="Search by department, doctor, payment"
            placeholderTextColor="$color9"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <XStack
              width={40}
              height={40}
              items="center"
              justify="center"
              rounded="$10"
              cursor="pointer"
              pressStyle={{ opacity: 0.6 }}
              hoverStyle={{ bg: "$color3" }}
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={18} color="$color9" />
            </XStack>
          ) : null}
        </XStack>
        <FilterBar value={filter} onChange={setFilter} counts={counts} />
      </YStack>

      {filtered.length === 0 ? (
        <EmptyState
          Icon={Search}
          title="No matching visits"
          detail="Try a different filter or clear your search."
        />
      ) : media.md ? (
        <VisitTable visits={filtered} />
      ) : (
        <YStack gap="$3">
          {filtered.map((v) => (
            <VisitRow key={v.id} visit={v} />
          ))}
        </YStack>
      )}
    </YStack>
  );
}

export default function PatientVisits() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { data: patient } = trpc.patient.useQuery();

  return (
    <Screen>
      <XStack items="center" justify="space-between" gap="$3">
        <YStack flex={1}>
          <IdentityChip
            patient={
              patient
                ? { name: patient.name, mrn: patient.ref, hospital: undefined }
                : undefined
            }
          />
        </YStack>
        <XStack
          items="center"
          gap="$1.5"
          px="$3"
          height={36}
          rounded="$10"
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          cursor="pointer"
          pressStyle={{ opacity: 0.7 }}
          hoverStyle={{ bg: "$color3" }}
          animation="quick"
          accessibilityRole="button"
          accessibilityLabel="Active medicines"
          onPress={() => router.push(`/patient/${uuid}/meds` as any)}
        >
          <Pill size={15} color="$color10" />
          <Text fontSize="$2" fontWeight="600" color="$color11">
            Active medicines
          </Text>
        </XStack>
      </XStack>

      <Section
        title="Visits"
        action={
          <Text fontSize="$2" color="$color9">
            Newest first
          </Text>
        }
      >
        <VisitList />
      </Section>
    </Screen>
  );
}
