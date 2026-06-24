import { router, useLocalSearchParams } from "expo-router";
import {
  BedDouble,
  ClipboardList,
  HeartPulse,
  Pill,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "@tamagui/lucide-icons";
import { Text, XStack, YStack } from "tamagui";
import {
  DLBack,
  DLCard,
  DLScreen,
  PiiValue,
  SkeletonList,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

function initials(name?: string) {
  return (
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?"
  );
}

/**
 * Health passport — a single emergency-facing screen a patient can show a clinician:
 * who they are, what they're allergic to, what they take, and whether they're admitted.
 * Composes existing read-only queries; nothing new is written.
 */
export default function Passport() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const patientQ = trpc.patient.useQuery();
  const allergyQ = trpc.patientAllergies.useQuery();
  const medsQ = trpc.patientActiveMedications.useQuery();
  const careQ = trpc.patientCareStatus.useQuery();
  const vitalsQ = trpc.patientVitals.useQuery();
  const conditionsQ = trpc.patientConditions.useQuery();

  const patient = patientQ.data;
  const allergies = allergyQ.data ?? [];
  const meds = (medsQ.data ?? []).filter((m) => m.active);
  const care = careQ.data;
  const vitals = vitalsQ.data ?? [];
  const conditions = conditionsQ.data ?? [];
  const loading = patientQ.isLoading || allergyQ.isLoading || medsQ.isLoading;

  return (
    <DLScreen maxWidth={620}>
      <DLBack label="Profile" onPress={() => router.replace(`/patient/${uuid}/profile` as any)} />

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <YStack gap="$3.5">
          <YStack px="$0.5" gap="$1">
            <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
              Health passport
            </Text>
            <Text fontSize={13} color="$text2">
              Show this to a clinician in an emergency.
            </Text>
          </YStack>

          {/* Identity */}
          <DLCard p="$4">
            <XStack items="center" gap="$3">
              <YStack width={52} height={52} rounded={14} bg="$primary" items="center" justify="center">
                <Text fontSize={18} fontWeight="700" color="$onPrimary">
                  {initials(patient?.name)}
                </Text>
              </YStack>
              <YStack flex={1} minW={0} gap="$1">
                <Text fontSize={17} fontWeight="800" color="$color12" numberOfLines={1}>
                  {patient?.name ?? "—"}
                </Text>
                <PiiValue value={patient?.mrn} kind="mrn" fontSize={13} fontWeight="600" color="$text2" />
                {patient?.hospital?.name ? (
                  <Text fontSize={12} color="$text2" numberOfLines={1}>
                    {patient.hospital.name}
                  </Text>
                ) : null}
              </YStack>
            </XStack>
          </DLCard>

          {/* Admission */}
          {care?.live?.isWard ? (
            <XStack items="center" gap="$2.5" bg="$primarySoft" rounded={13} px="$3.5" py="$3">
              <BedDouble size={18} color="$primary" />
              <Text fontSize={13.5} fontWeight="600" color="$primary">
                Currently admitted{care.live.ward ? ` · ${care.live.ward}` : ""}
              </Text>
            </XStack>
          ) : null}

          {/* Allergies — the safety headline */}
          <DLCard
            p="$4"
            gap="$2.5"
            borderColor={allergies.length ? "$bad" : "$border"}
            bg={allergies.length ? "$badSoft" : "$surface"}
          >
            <XStack items="center" gap="$2">
              {allergies.length ? <ShieldAlert size={18} color="$bad" /> : <ShieldCheck size={18} color="$good" />}
              <Text fontSize={14.5} fontWeight="800" color="$color12">
                Allergies
              </Text>
            </XStack>
            {allergies.length ? (
              allergies.map((a) => (
                <XStack key={a.id} items="flex-start" gap="$2">
                  <TriangleAlert size={14} color="$bad" />
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="700" color="$color12">
                      {a.substance}
                    </Text>
                    {a.reactions.length ? (
                      <Text fontSize={12} color="$text2">
                        {a.reactions.join(", ")}
                        {a.criticality === "high" ? " · high severity" : ""}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>
              ))
            ) : (
              <Text fontSize={13} color="$text2">
                No known allergies recorded. Tell your clinician if this is wrong.
              </Text>
            )}
          </DLCard>

          {/* Problem list — active conditions first */}
          {conditions.length ? (
            <DLCard p="$4" gap="$2.5">
              <XStack items="center" gap="$2">
                <ClipboardList size={18} color="$primary" />
                <Text fontSize={14.5} fontWeight="800" color="$color12">
                  Problem list
                </Text>
              </XStack>
              {conditions.map((c) => {
                const inactive = c.clinicalStatus && c.clinicalStatus !== "active";
                const since = (c.onset ?? c.recordedAt)?.slice(0, 10);
                return (
                  <XStack key={c.id} items="center" justify="space-between" gap="$3">
                    <YStack flex={1} minW={0}>
                      <Text fontSize={14} fontWeight="600" color="$color12" numberOfLines={2}>
                        {c.name}
                      </Text>
                      {since ? (
                        <Text fontSize={12} color="$text2">
                          Since {since}
                        </Text>
                      ) : null}
                    </YStack>
                    {inactive ? (
                      <Text fontSize={11} fontWeight="700" color="$text3" textTransform="capitalize">
                        {c.clinicalStatus}
                      </Text>
                    ) : null}
                  </XStack>
                );
              })}
            </DLCard>
          ) : null}

          {/* Active medicines */}
          <DLCard p="$4" gap="$2.5">
            <XStack items="center" gap="$2">
              <Pill size={18} color="$primary" />
              <Text fontSize={14.5} fontWeight="800" color="$color12">
                Current medicines ({meds.length})
              </Text>
            </XStack>
            {meds.length ? (
              meds.map((m) => (
                <XStack key={m.id} items="center" justify="space-between" gap="$3">
                  <Text fontSize={14} fontWeight="600" color="$color12" flex={1} numberOfLines={1}>
                    {[m.name, m.strength].filter(Boolean).join(" ")}
                  </Text>
                  {m.frequency ? (
                    <Text fontSize={12} color="$text2">
                      {m.frequency}
                    </Text>
                  ) : null}
                </XStack>
              ))
            ) : (
              <Text fontSize={13} color="$text2">
                No active medicines on record.
              </Text>
            )}
          </DLCard>

          {/* Latest vitals */}
          {vitals.length ? (
            <DLCard p="$4" gap="$3">
              <XStack items="center" gap="$2">
                <HeartPulse size={18} color="$primary" />
                <Text fontSize={14.5} fontWeight="800" color="$color12">
                  Latest vitals
                </Text>
              </XStack>
              <XStack flexWrap="wrap" gap="$2.5">
                {vitals.map((v) => (
                  <YStack
                    key={v.key}
                    width="48%"
                    bg="$surface2"
                    rounded={12}
                    px="$3"
                    py="$2.5"
                    gap="$0.5"
                  >
                    <Text fontSize={11.5} fontWeight="600" color="$text2">
                      {v.label}
                    </Text>
                    <Text fontSize={18} fontWeight="700" fontFamily="$mono" color="$color12" letterSpacing={-0.5}>
                      {v.value}
                      {v.unit ? (
                        <Text fontSize={10.5} color="$text3" fontWeight="500" fontFamily="$body">
                          {" "}
                          {v.unit}
                        </Text>
                      ) : null}
                    </Text>
                    {v.takenAt ? (
                      <Text fontSize={10.5} color="$text3">
                        {v.takenAt.slice(0, 10)}
                      </Text>
                    ) : null}
                  </YStack>
                ))}
              </XStack>
            </DLCard>
          ) : null}

          <Text fontSize={11.5} color="$text3" text="center" px="$4">
            Read-only summary from your hospital records. Not a substitute for clinical assessment.
          </Text>
        </YStack>
      )}
    </DLScreen>
  );
}
