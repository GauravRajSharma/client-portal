import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { BadgeCheck, Info, Receipt, ShieldCheck } from "@tamagui/lucide-icons";
import { Text, XStack, YStack, useMedia } from "tamagui";
import type { Bill, BillLine } from "@/server/dto";
import {
  DLCard,
  DLNavRow,
  DLScreen,
  DLStatusPill,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
  dlMoney,
} from "@/components/ui";
import { trpc } from "@/utils/trpc";

/* Billing & insurance — strictly read-only. Answers, in order:
 *   1. What do I owe right now?  2. What was I charged for?  3. What did insurance cover? */

const CCY = "NPR";

function billStatus(b: Bill): { label: string; color: any; soft: any } {
  if (b.due <= 0 && b.total > 0) return { label: "Settled", color: "$good", soft: "$goodSoft" };
  if (b.due > 0 && b.paid > 0) return { label: "Partly paid", color: "$warn", soft: "$warnSoft" };
  if (b.due > 0) return { label: "Due", color: "$warn", soft: "$warnSoft" };
  return { label: b.paymentStatus ?? "—", color: "$text3", soft: "$surface3" };
}

/** Odoo amount is tax-inclusive while unitPrice is pre-tax, so only show the
 *  "qty × unit" hint when it genuinely reconciles (within rounding). */
function reconciles(line: BillLine): boolean {
  if (line.quantity === undefined || line.unitPrice === undefined) return false;
  return Math.abs(line.quantity * line.unitPrice - line.amount) < 0.5;
}

function Money({ amount, size = 14, weight = "700", color = "$color12" }: { amount?: number; size?: number; weight?: any; color?: any }) {
  return (
    <Text fontSize={size} fontWeight={weight} fontFamily="$mono" color={color} letterSpacing={-0.3}>
      {dlMoney(amount, CCY)}
    </Text>
  );
}

function OutstandingHeader({ bills }: { bills: Bill[] }) {
  const totals = useMemo(() => {
    let due = 0;
    let billed = 0;
    let paid = 0;
    for (const b of bills) {
      // A refund returns money, so it nets down billed/paid, not up.
      const sign = b.kind === "refund" ? -1 : 1;
      due += b.due;
      billed += sign * b.total;
      paid += sign * b.paid;
    }
    return { due: Math.max(0, due), billed: Math.max(0, billed), paid: Math.max(0, paid) };
  }, [bills]);
  const settled = totals.due <= 0;

  return (
    <DLCard p="$4" gap="$3.5">
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack gap="$1.5">
          <Text fontSize={12.5} fontWeight="600" color="$text2">
            Outstanding balance
          </Text>
          <Text fontSize={36} fontWeight="700" fontFamily="$mono" color={settled ? "$good" : "$color12"} letterSpacing={-1.5}>
            {dlMoney(totals.due, CCY)}
          </Text>
        </YStack>
        {settled ? (
          <DLStatusPill label="All settled" color="$good" soft="$goodSoft" />
        ) : (
          <DLStatusPill label="Payment due" color="$warn" soft="$warnSoft" />
        )}
      </XStack>
      <XStack gap="$6" pt="$3" borderTopWidth={1} borderColor="$border" flexWrap="wrap">
        <YStack gap="$1">
          <Text fontSize={11.5} color="$text2">
            Total billed
          </Text>
          <Money amount={totals.billed} size={15} color="$color11" />
        </YStack>
        <YStack gap="$1">
          <Text fontSize={11.5} color="$text2">
            Paid or covered
          </Text>
          <Money amount={totals.paid} size={15} color="$color11" />
        </YStack>
      </XStack>
    </DLCard>
  );
}

function LineRow({ line, wide }: { line: BillLine; wide: boolean }) {
  if (wide) {
    return (
      <XStack items="center" gap="$3" py="$2">
        <Text flex={1} fontSize={13} color="$color12" numberOfLines={2}>
          {line.description}
        </Text>
        <Text width={44} text="right" fontSize={13} color="$text2" fontFamily="$mono">
          {line.quantity ?? "—"}
        </Text>
        <YStack width={120} items="flex-end">
          <Money amount={line.unitPrice} size={13} weight="500" color="$text2" />
        </YStack>
        <YStack width={130} items="flex-end">
          <Money amount={line.amount} size={13} color="$color12" />
        </YStack>
      </XStack>
    );
  }
  return (
    <XStack items="flex-start" justify="space-between" gap="$3" py="$2">
      <YStack flex={1} minW={0} gap="$0.5">
        <Text fontSize={13} color="$color12">
          {line.description}
        </Text>
        {reconciles(line) ? (
          <Text fontSize={11.5} color="$text3" fontFamily="$mono">
            {line.quantity} × {dlMoney(line.unitPrice, CCY)}
          </Text>
        ) : line.quantity !== undefined && line.quantity !== 1 ? (
          <Text fontSize={11.5} color="$text3" fontFamily="$mono">
            Qty {line.quantity}
          </Text>
        ) : null}
      </YStack>
      <Money amount={line.amount} size={13} color="$color12" />
    </XStack>
  );
}

function LineHeader() {
  return (
    <XStack items="center" gap="$3" pb="$1.5" borderBottomWidth={1} borderColor="$border">
      <Text flex={1} fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase" letterSpacing={0.3}>
        Item
      </Text>
      <Text width={44} text="right" fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase">
        Qty
      </Text>
      <Text width={120} text="right" fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase">
        Unit
      </Text>
      <Text width={130} text="right" fontSize={10.5} fontWeight="700" color="$text3" textTransform="uppercase">
        Amount
      </Text>
    </XStack>
  );
}

function CoverageBlock({ insurance }: { insurance: NonNullable<Bill["insurance"]> }) {
  return (
    <YStack gap="$2.5" p="$3.5" rounded={13} bg="$surface2" borderWidth={1} borderColor="$border">
      <XStack items="center" gap="$2">
        <ShieldCheck size={16} color="$primary" />
        <Text fontSize={13.5} fontWeight="700" color="$color12">
          {insurance.scheme}
        </Text>
      </XStack>
      <XStack gap="$6" flexWrap="wrap">
        {insurance.number ? (
          <YStack gap="$0.5">
            <Text fontSize={11} color="$text2">
              Member number
            </Text>
            <Text fontSize={12.5} fontWeight="600" color="$color11" fontFamily="$mono">
              {insurance.number}
            </Text>
          </YStack>
        ) : null}
        {insurance.claimCode ? (
          <YStack gap="$0.5">
            <Text fontSize={11} color="$text2">
              Claim code
            </Text>
            <Text fontSize={12.5} fontWeight="600" color="$color11" fontFamily="$mono">
              {insurance.claimCode}
            </Text>
          </YStack>
        ) : null}
        {insurance.status ? (
          <YStack gap="$0.5">
            <Text fontSize={11} color="$text2">
              Status
            </Text>
            <Text fontSize={12.5} fontWeight="600" color="$color11">
              {insurance.status}
            </Text>
          </YStack>
        ) : null}
      </XStack>
      <XStack gap="$3" pt="$2.5" borderTopWidth={1} borderColor="$border" flexWrap="wrap">
        <YStack flex={1} minW={130} gap="$1">
          <Text fontSize={11.5} color="$text2">
            Paid or covered
          </Text>
          <Money amount={insurance.covered} size={15} color="$good" />
        </YStack>
        <YStack flex={1} minW={130} gap="$1">
          <Text fontSize={11.5} color="$text2">
            Your share to pay
          </Text>
          <Money amount={insurance.patientPayable} size={15} color={insurance.patientPayable > 0 ? "$warn" : "$good"} />
        </YStack>
      </XStack>
    </YStack>
  );
}

function BillCard({ bill, wide }: { bill: Bill; wide: boolean }) {
  const status = billStatus(bill);
  const isRefund = bill.kind === "refund";
  return (
    <DLCard p="$4" gap="$3">
      <XStack items="flex-start" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1" flex={1} minW={0}>
          <Text fontSize={14.5} fontWeight="700" color="$color12" numberOfLines={1}>
            {bill.number ?? "Bill"}
          </Text>
          <XStack items="center" gap="$2" flexWrap="wrap">
            {bill.date ? (
              <Text fontSize={12} color="$text2">
                {bill.date.slice(0, 10)}
              </Text>
            ) : null}
            {bill.careType ? (
              <Text fontSize={11.5} fontWeight="600" color="$text3">
                {bill.careType}
              </Text>
            ) : null}
          </XStack>
        </YStack>
        <YStack items="flex-end" gap="$1.5">
          {isRefund ? <DLStatusPill label="Refund" color="$primary" soft="$primarySoft" size="sm" /> : null}
          <DLStatusPill label={status.label} color={status.color} soft={status.soft} size="sm" />
        </YStack>
      </XStack>

      {bill.claimCode || bill.orderedBy ? (
        <XStack items="center" gap="$2" bg="$primarySoft" rounded={10} px="$3" py="$2" flexWrap="wrap">
          <ShieldCheck size={14} color="$primary" />
          {bill.claimCode ? (
            <Text fontSize={11.5} fontWeight="600" color="$primary" fontFamily="$mono">
              Claim {bill.claimCode}
            </Text>
          ) : (
            <Text fontSize={11.5} fontWeight="600" color="$primary">
              Insurance claim
            </Text>
          )}
          {bill.orderedBy ? (
            <Text fontSize={11.5} color="$primary">
              · {bill.orderedBy}
            </Text>
          ) : null}
        </XStack>
      ) : null}

      {bill.lines.length > 0 ? (
        <YStack gap="$0.5">
          {wide ? <LineHeader /> : null}
          {bill.lines.map((line, i) => (
            <LineRow key={`${bill.id}-${i}`} line={line} wide={wide} />
          ))}
        </YStack>
      ) : (
        <Text fontSize={12.5} color="$text3">
          Itemized charges are not available for this bill.
        </Text>
      )}

      <YStack gap="$1.5" pt="$2.5" borderTopWidth={1} borderColor="$border">
        <XStack items="center" justify="space-between">
          <Text fontSize={13} color="$text2">
            Total
          </Text>
          <Money amount={bill.total} size={14} />
        </XStack>
        {bill.insurance ? null : (
          <XStack items="center" justify="space-between">
            <Text fontSize={13} color="$text2">
              Paid
            </Text>
            <Money amount={bill.paid} size={14} weight="600" color="$text2" />
          </XStack>
        )}
        <XStack items="center" justify="space-between">
          <Text fontSize={13.5} fontWeight="700" color="$color12">
            You owe
          </Text>
          <Money amount={bill.due} size={17} color={bill.due > 0 ? "$warn" : "$good"} />
        </XStack>
      </YStack>

      {bill.insurance ? <CoverageBlock insurance={bill.insurance} /> : null}
    </DLCard>
  );
}

export default function Billing() {
  const media = useMedia();
  const wide = Boolean(media.md);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { data, isLoading, isError, refetch } = trpc.patientBills.useQuery(undefined, { retry: 1 });

  return (
    <DLScreen>
      <DLTitle title="Billing" subtitle="Your charges and insurance coverage." />

      {/* Claim lifecycle + NHIS balance live on their own screen. */}
      <DLCard overflow="hidden">
        <DLNavRow
          Icon={BadgeCheck}
          title="Insurance claims & balance"
          detail="NHIS / HIB claim status and coverage"
          onPress={() => router.push(`/patient/${uuid}/insurance` as any)}
        />
      </DLCard>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load your bills"
          detail="We could not reach the billing records right now. Please try again."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title="No bills"
          detail="You have no billing records yet. Charges from your hospital visits will appear here."
        />
      ) : (
        <YStack gap="$3.5">
          <OutstandingHeader bills={data} />
          <XStack items="center" gap="$2.5" px="$3.5" py="$2.5" rounded={12} bg="$surface2" borderWidth={1} borderColor="$border">
            <Info size={15} color="$text3" />
            <Text flex={1} fontSize={12} color="$text2" lineHeight={17}>
              This is a view of your charges and insurance. It is read only. To pay or ask about a charge, contact the hospital billing desk.
            </Text>
          </XStack>
          {data.map((bill) => (
            <BillCard key={bill.id ?? bill.number} bill={bill} wide={wide} />
          ))}
        </YStack>
      )}
    </DLScreen>
  );
}
