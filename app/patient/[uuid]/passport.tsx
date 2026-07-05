import { router, useLocalSearchParams } from "expo-router";
import { BedDouble, Pill, ShieldAlert, ShieldCheck, TriangleAlert, C } from "@/components/ui/icons";
import { HStack, VStack, Text } from "@/components/ui/gs";
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

  const patient = patientQ.data;
  const allergies = allergyQ.data ?? [];
  const meds = (medsQ.data ?? []).filter((m) => m.active);
  const care = careQ.data;
  const loading = patientQ.isLoading || allergyQ.isLoading || medsQ.isLoading;

  return (
    <DLScreen maxWidth={620}>
      <DLBack label="Profile" onPress={() => router.replace(`/patient/${uuid}/profile` as any)} />

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <VStack className="gap-[15px]">
          <VStack className="px-[1px] gap-[2px]">
            <Text className="text-[23px] font-plex-bold text-fg tracking-[-0.4px]">
              Health passport
            </Text>
            <Text className="text-[13px] text-text2">
              Show this to a clinician in an emergency.
            </Text>
          </VStack>

          {/* Identity */}
          <DLCard className="p-[17px]">
            <HStack className="items-center gap-[12px]">
              <VStack className="w-[52px] h-[52px] rounded-[14px] bg-primary items-center justify-center">
                <Text className="text-[18px] font-plex-bold text-onPrimary">
                  {initials(patient?.name)}
                </Text>
              </VStack>
              <VStack className="flex-1 min-w-0 gap-[2px]">
                <Text className="text-[17px] font-plex-bold text-fg" numberOfLines={1}>
                  {patient?.name ?? "—"}
                </Text>
                <PiiValue value={patient?.mrn} kind="mrn" className="text-[13px] font-plex-semibold text-text2" />
                {patient?.hospital?.name ? (
                  <Text className="text-[12px] text-text2" numberOfLines={1}>
                    {patient.hospital.name}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
          </DLCard>

          {/* Admission */}
          {care?.live?.isWard ? (
            <HStack className="items-center gap-[10px] bg-primarySoft rounded-[13px] px-[15px] py-[12px]">
              <BedDouble size={18} color={C.primary} />
              <Text className="text-[13.5px] font-plex-semibold text-primary">
                Currently admitted{care.live.ward ? ` · ${care.live.ward}` : ""}
              </Text>
            </HStack>
          ) : null}

          {/* Allergies — the safety headline */}
          <DLCard
            className={`p-[17px] gap-[10px] ${allergies.length ? "border-bad bg-badSoft" : ""}`}
          >
            <HStack className="items-center gap-[7px]">
              {allergies.length ? <ShieldAlert size={18} color={C.bad} /> : <ShieldCheck size={18} color={C.good} />}
              <Text className="text-[14.5px] font-plex-bold text-fg">
                Allergies
              </Text>
            </HStack>
            {allergies.length ? (
              allergies.map((a) => (
                <HStack key={a.id} className="items-start gap-[7px]">
                  <TriangleAlert size={14} color={C.bad} />
                  <VStack className="flex-1">
                    <Text className="text-[14px] font-plex-bold text-fg">
                      {a.substance}
                    </Text>
                    {a.reactions.length ? (
                      <Text className="text-[12px] text-text2">
                        {a.reactions.join(", ")}
                        {a.criticality === "high" ? " · high severity" : ""}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>
              ))
            ) : (
              <Text className="text-[13px] text-text2">
                No known allergies recorded. Tell your clinician if this is wrong.
              </Text>
            )}
          </DLCard>

          {/* Active medicines */}
          <DLCard className="p-[17px] gap-[10px]">
            <HStack className="items-center gap-[7px]">
              <Pill size={18} color={C.primary} />
              <Text className="text-[14.5px] font-plex-bold text-fg">
                Current medicines ({meds.length})
              </Text>
            </HStack>
            {meds.length ? (
              meds.map((m) => (
                <HStack key={m.id} className="items-center justify-between gap-[12px]">
                  <Text className="text-[14px] font-plex-semibold text-fg flex-1" numberOfLines={1}>
                    {[m.name, m.strength].filter(Boolean).join(" ")}
                  </Text>
                  {m.frequency ? (
                    <Text className="text-[12px] text-text2">
                      {m.frequency}
                    </Text>
                  ) : null}
                </HStack>
              ))
            ) : (
              <Text className="text-[13px] text-text2">
                No active medicines on record.
              </Text>
            )}
          </DLCard>

          <Text className="text-[11.5px] text-text3 text-center px-[17px]">
            Read-only summary from your hospital records. Not a substitute for clinical assessment.
          </Text>
        </VStack>
      )}
    </DLScreen>
  );
}
