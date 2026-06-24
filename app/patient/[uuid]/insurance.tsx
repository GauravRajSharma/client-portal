import { router, useLocalSearchParams } from "expo-router";
import { BadgeCheck, Clock, ShieldCheck } from "@tamagui/lucide-icons";
import { Text, XStack, YStack } from "tamagui";
import {
  DLBack,
  DLCard,
  DLScreen,
  DLStatusPill,
  EmptyState,
  ErrorState,
  SkeletonList,
  dlMoney,
} from "@/components/ui";
import type { InsuranceClaim } from "@/server/dto";
import { trpc } from "@/utils/trpc";

const TONE: Record<InsuranceClaim["tone"], { color: string; soft: string }> = {
  good: { color: "$good", soft: "$goodSoft" },
  warn: { color: "$warn", soft: "$warnSoft" },
  bad: { color: "$bad", soft: "$badSoft" },
  neutral: { color: "$text3", soft: "$surface3" },
};

/** Vertical state-transition timeline for one claim. */
function Timeline({ claim }: { claim: InsuranceClaim }) {
  if (!claim.timeline.length) return null;
  return (
    <YStack gap="$0" mt="$1">
      {claim.timeline.map((e, i) => {
        const last = i === claim.timeline.length - 1;
        return (
          <XStack key={`${e.state}-${i}`} gap="$3">
            <YStack items="center" width={14}>
              <YStack width={9} height={9} rounded={10} bg={last ? "$primary" : "$border"} mt="$1" />
              {!last ? <YStack width={2} flex={1} bg="$border" my="$1" /> : null}
            </YStack>
            <YStack flex={1} pb={last ? "$0" : "$3"}>
              <Text fontSize={13} fontWeight="600" color="$color12">
                {e.label}
              </Text>
              {e.at ? (
                <Text fontSize={11.5} color="$text2">
                  {e.at.slice(0, 16).replace("T", " ")}
                </Text>
              ) : null}
              {e.note ? (
                <Text fontSize={12} color="$text2" mt="$0.5">
                  {e.note}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        );
      })}
    </YStack>
  );
}

function ClaimCard({ claim }: { claim: InsuranceClaim }) {
  const tone = TONE[claim.tone];
  return (
    <DLCard p="$4" gap="$3">
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack flex={1} minW={0}>
          <Text fontSize={15} fontWeight="700" color="$color12" numberOfLines={1}>
            {claim.claimCode ? `Claim ${claim.claimCode}` : "Insurance claim"}
          </Text>
          <Text fontSize={12} color="$text2">
            {[claim.careType, claim.claimedOn?.slice(0, 10)].filter(Boolean).join(" · ") || "—"}
          </Text>
        </YStack>
        <DLStatusPill label={claim.statusLabel} color={tone.color} soft={tone.soft} />
      </XStack>

      {/* Amounts: claimed vs approved (only what the backend stored). */}
      <XStack gap="$2.5">
        <YStack flex={1} bg="$surface2" rounded={12} px="$3" py="$2.5" gap="$0.5">
          <Text fontSize={11.5} fontWeight="600" color="$text2">
            Claimed
          </Text>
          <Text fontSize={15} fontWeight="700" fontFamily="$mono" color="$color12">
            {dlMoney(claim.claimedAmount, claim.currency)}
          </Text>
        </YStack>
        <YStack flex={1} bg="$surface2" rounded={12} px="$3" py="$2.5" gap="$0.5">
          <Text fontSize={11.5} fontWeight="600" color="$text2">
            Approved
          </Text>
          <Text
            fontSize={15}
            fontWeight="700"
            fontFamily="$mono"
            color={claim.tone === "good" ? "$good" : "$color12"}
          >
            {dlMoney(claim.approvedAmount, claim.currency)}
          </Text>
        </YStack>
      </XStack>

      {claim.rejectionReason ? (
        <Text fontSize={12.5} color="$bad">
          {claim.rejectionReason}
        </Text>
      ) : null}

      <Timeline claim={claim} />
    </DLCard>
  );
}

export default function Insurance() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const claimsQ = trpc.patientInsuranceClaims.useQuery();
  const balanceQ = trpc.patientNhisBalance.useQuery();

  const claims = claimsQ.data ?? [];
  const balance = balanceQ.data;

  return (
    <DLScreen maxWidth={680}>
      <DLBack label="Billing" onPress={() => router.replace(`/patient/${uuid}/billing` as any)} />

      <YStack px="$0.5" gap="$1">
        <Text fontSize={23} fontWeight="700" color="$color12" letterSpacing={-0.4}>
          Insurance
        </Text>
        <Text fontSize={13} color="$text2">
          Your NHIS / HIB membership and claim history.
        </Text>
      </YStack>

      {/* NHIS balance — last known snapshot, honestly dated. */}
      <DLCard p="$4" gap="$3">
        <XStack items="center" gap="$2">
          <ShieldCheck size={18} color="$primary" />
          <Text fontSize={14.5} fontWeight="800" color="$color12">
            NHIS membership
          </Text>
        </XStack>
        <XStack items="center" justify="space-between" gap="$3">
          <Text fontSize={12.5} color="$text2">
            Member number
          </Text>
          <Text fontSize={14} fontWeight="700" fontFamily="$mono" color="$color12">
            {balance?.number ?? "—"}
          </Text>
        </XStack>
        {balance?.asOf ? (
          <YStack gap="$2" bg="$primarySoft" rounded={12} px="$3.5" py="$3">
            <Text fontSize={12} fontWeight="600" color="$primary">
              Last known balance · as of {balance.asOf.slice(0, 10)}
            </Text>
            <Text fontSize={24} fontWeight="700" fontFamily="$mono" color="$primary" letterSpacing={-0.5}>
              {dlMoney(balance.totalBalance, balance.currency)}
            </Text>
            <Text fontSize={11} color="$primary" opacity={0.85}>
              Balances are checked with HIB at the time of a claim. This is the figure recorded then,
              not a live balance.
            </Text>
          </YStack>
        ) : (
          <Text fontSize={12.5} color="$text2">
            No balance on record yet. It is captured the first time a claim is made.
          </Text>
        )}
      </DLCard>

      {/* Claims */}
      <Text fontSize={15} fontWeight="700" color="$color12" px="$0.5" mt="$1">
        Claims
      </Text>

      {claimsQ.isError ? (
        <ErrorState
          title="Couldn't load your claims"
          detail="This is usually a network hiccup. Please try again."
          onRetry={() => claimsQ.refetch()}
        />
      ) : claimsQ.isLoading ? (
        <SkeletonList count={3} />
      ) : claims.length === 0 ? (
        <EmptyState
          Icon={BadgeCheck}
          title="No insurance claims"
          detail="When a visit is claimed against your NHIS / HIB membership, it will appear here with its status."
        />
      ) : (
        <YStack gap="$3">
          {claims.map((c) => (
            <ClaimCard key={c.id} claim={c} />
          ))}
        </YStack>
      )}

      <XStack items="center" gap="$2" px="$1" mt="$1">
        <Clock size={13} color="$text3" />
        <Text fontSize={11.5} color="$text3" flex={1}>
          Read-only view of claims submitted by your hospital to the Health Insurance Board.
        </Text>
      </XStack>
    </DLScreen>
  );
}
