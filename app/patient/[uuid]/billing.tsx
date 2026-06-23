import {
  DateText,
  EmptyState,
  ErrorState,
  Money,
  Panel,
  Screen,
  Section,
  SkeletonList,
  StatusPill,
} from "@/components/ui";
import type { Bill, BillLine } from "@/server/dto";
import { trpc } from "@/utils/trpc";
import { Info, Receipt, ShieldCheck } from "@tamagui/lucide-icons";
import { useMemo } from "react";
import { Paragraph, Text, Theme, XStack, YStack, useMedia } from "tamagui";

/* ---------------------------------------------------------------------------
 * Billing & insurance — read-only.
 *
 * Answers, in order of what a patient actually asks:
 *   1. "What do I owe right now?"  -> outstanding balance, up top, large.
 *   2. "What was I charged for?"   -> itemized lines per bill.
 *   3. "What did my insurance cover?" -> a plain-language coverage block.
 *
 * Everything here is a view. Nothing on this screen can change money.
 * ------------------------------------------------------------------------- */

const CURRENCY = "NPR";

/** Map a bill's settlement to a calm status pill theme + label. */
function billStatus(bill: Bill): {
  label: string;
  theme: "success" | "warning" | "neutral";
} {
  if (bill.due <= 0 && bill.total > 0)
    return { label: "Settled", theme: "success" };
  if (bill.due > 0 && bill.paid > 0)
    return { label: "Partly paid", theme: "warning" };
  if (bill.due > 0) return { label: "Due", theme: "warning" };
  return { label: bill.paymentStatus ?? "—", theme: "neutral" };
}

/** A faint, informational banner clarifying this screen is view-only. */
function ViewOnlyNote() {
  return (
    <XStack
      items="center"
      gap="$2.5"
      px="$3.5"
      py="$2.5"
      rounded="$6"
      bg="$color2"
      borderColor="$borderColor"
      borderWidth={1}
    >
      <Info size={16} color="$color10" />
      <Paragraph flex={1} fontSize="$2" color="$color10" lineHeight="$1">
        This is an informational view of your charges and insurance. It is read
        only. To pay or to ask about a charge, please contact the hospital
        billing desk.
      </Paragraph>
    </XStack>
  );
}

/** The headline: total outstanding across all bills. The first thing seen. */
function OutstandingHeader({ bills }: { bills: Bill[] }) {
  const totals = useMemo(() => {
    let due = 0;
    let billed = 0;
    let paid = 0;
    for (const b of bills) {
      due += b.due;
      billed += b.total;
      paid += b.paid;
    }
    return { due, billed, paid };
  }, [bills]);

  const settled = totals.due <= 0;

  return (
    <Panel gap="$3">
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1.5">
          <Text fontSize="$3" fontWeight="600" color="$color10">
            Outstanding balance
          </Text>
          <Theme name={settled ? "success" : "warning"}>
            <Money
              amount={Math.max(0, totals.due)}
              currency={CURRENCY}
              size="$10"
              weight="800"
              color="$color12"
            />
          </Theme>
        </YStack>
        {settled ? (
          <StatusPill label="All settled" theme="success" Icon={ShieldCheck} />
        ) : (
          <StatusPill label="Payment due" theme="warning" />
        )}
      </XStack>

      <XStack
        borderTopWidth={1}
        borderColor="$borderColor"
        pt="$3"
        gap="$6"
        flexWrap="wrap"
      >
        <YStack gap="$1">
          <Text fontSize="$2" color="$color9">
            Total billed
          </Text>
          <Money
            amount={totals.billed}
            currency={CURRENCY}
            size="$5"
            weight="700"
            color="$color11"
          />
        </YStack>
        <YStack gap="$1">
          <Text fontSize="$2" color="$color9">
            Paid or covered
          </Text>
          <Money
            amount={totals.paid}
            currency={CURRENCY}
            size="$5"
            weight="700"
            color="$color11"
          />
        </YStack>
      </XStack>
    </Panel>
  );
}

/**
 * Does "qty × unitPrice" actually reconcile to the line amount? Odoo's amount is
 * tax-inclusive while unitPrice is pre-tax, so the two often differ. We only show
 * the multiplication hint when it genuinely adds up (within rounding); otherwise
 * showing "2 × 500 = 1130" would read as a mistake and erode trust.
 */
function reconciles(line: BillLine): boolean {
  if (line.quantity === undefined || line.unitPrice === undefined) return false;
  return Math.abs(line.quantity * line.unitPrice - line.amount) < 0.5;
}

/** One itemized charge line. Web shows a table-aligned row; mobile stacks. */
function LineRow({ line, wide }: { line: BillLine; wide: boolean }) {
  if (wide) {
    return (
      <XStack items="center" gap="$3" py="$2">
        <YStack flex={1} minW={0}>
          <Text fontSize="$3" color="$color12" numberOfLines={2}>
            {line.description}
          </Text>
        </YStack>
        <Text
          width={48}
          text="right"
          fontSize="$3"
          color="$color10"
          fontVariant={["tabular-nums"]}
        >
          {line.quantity ?? "—"}
        </Text>
        <YStack width={120} items="flex-end">
          <Money
            amount={line.unitPrice}
            currency={CURRENCY}
            size="$3"
            weight="500"
            color="$color10"
          />
        </YStack>
        <YStack width={140} items="flex-end">
          <Money
            amount={line.amount}
            currency={CURRENCY}
            size="$3"
            weight="700"
            color="$color12"
          />
        </YStack>
      </XStack>
    );
  }
  return (
    <XStack items="flex-start" justify="space-between" gap="$3" py="$2">
      <YStack flex={1} minW={0} gap="$1">
        <Text fontSize="$3" color="$color12">
          {line.description}
        </Text>
        {reconciles(line) ? (
          <Text fontSize="$2" color="$color9" fontVariant={["tabular-nums"]}>
            {line.quantity}
            {" × "}
            {`${CURRENCY} ${line.unitPrice!.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          </Text>
        ) : line.quantity !== undefined && line.quantity !== 1 ? (
          <Text fontSize="$2" color="$color9" fontVariant={["tabular-nums"]}>
            Qty {line.quantity}
          </Text>
        ) : null}
      </YStack>
      <Money
        amount={line.amount}
        currency={CURRENCY}
        size="$3"
        weight="700"
        color="$color12"
      />
    </XStack>
  );
}

/** Column headers for the web itemization table. */
function LineHeader() {
  return (
    <XStack
      items="center"
      gap="$3"
      pb="$1.5"
      borderBottomWidth={1}
      borderColor="$borderColor"
    >
      <Text
        flex={1}
        fontSize="$1"
        fontWeight="700"
        color="$color9"
        textTransform="uppercase"
      >
        Item
      </Text>
      <Text
        width={48}
        text="right"
        fontSize="$1"
        fontWeight="700"
        color="$color9"
        textTransform="uppercase"
      >
        Qty
      </Text>
      <Text
        width={120}
        text="right"
        fontSize="$1"
        fontWeight="700"
        color="$color9"
        textTransform="uppercase"
      >
        Unit price
      </Text>
      <Text
        width={140}
        text="right"
        fontSize="$1"
        fontWeight="700"
        color="$color9"
        textTransform="uppercase"
      >
        Amount
      </Text>
    </XStack>
  );
}

/** The insurance coverage block: scheme, claim code, covered vs you-pay. */
function CoverageBlock({
  insurance,
}: { insurance: NonNullable<Bill["insurance"]> }) {
  return (
    <YStack
      gap="$2.5"
      mt="$2"
      p="$3"
      rounded="$6"
      bg="$color2"
      borderColor="$borderColor"
      borderWidth={1}
    >
      <XStack items="center" gap="$2">
        <ShieldCheck size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="700" color="$color12">
          {insurance.scheme}
        </Text>
      </XStack>

      <XStack gap="$6" flexWrap="wrap">
        {insurance.number ? (
          <YStack gap="$0.5">
            <Text fontSize="$1" color="$color9">
              Member number
            </Text>
            <Text
              fontSize="$2"
              fontWeight="600"
              color="$color11"
              fontVariant={["tabular-nums"]}
            >
              {insurance.number}
            </Text>
          </YStack>
        ) : null}
        {insurance.claimCode ? (
          <YStack gap="$0.5">
            <Text fontSize="$1" color="$color9">
              Claim code
            </Text>
            <Text
              fontSize="$2"
              fontWeight="600"
              color="$color11"
              fontVariant={["tabular-nums"]}
            >
              {insurance.claimCode}
            </Text>
          </YStack>
        ) : null}
        {insurance.status ? (
          <YStack gap="$0.5">
            <Text fontSize="$1" color="$color9">
              Status
            </Text>
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {insurance.status}
            </Text>
          </YStack>
        ) : null}
      </XStack>

      <XStack
        gap="$3"
        pt="$2.5"
        borderTopWidth={1}
        borderColor="$borderColor"
        flexWrap="wrap"
      >
        <YStack flex={1} minW={140} gap="$1">
          <Text fontSize="$2" color="$color9">
            Paid or covered
          </Text>
          <Theme name="success">
            <Money
              amount={insurance.covered}
              currency={CURRENCY}
              size="$5"
              weight="700"
              color="$color11"
            />
          </Theme>
        </YStack>
        <YStack flex={1} minW={140} gap="$1">
          <Text fontSize="$2" color="$color9">
            Your share to pay
          </Text>
          <Theme name={insurance.patientPayable > 0 ? "warning" : "success"}>
            <Money
              amount={insurance.patientPayable}
              currency={CURRENCY}
              size="$5"
              weight="700"
              color="$color11"
            />
          </Theme>
        </YStack>
      </XStack>

      <Text fontSize="$1" color="$color9" lineHeight="$1">
        This bill is filed under your insurance. The covered amount is confirmed
        by the hospital and may update as your claim is processed.
      </Text>
    </YStack>
  );
}

/** One bill: header (number, date, status), itemized lines, totals, coverage. */
function BillCard({ bill, wide }: { bill: Bill; wide: boolean }) {
  const status = billStatus(bill);
  return (
    <Panel gap="$3">
      <XStack
        items="flex-start"
        justify="space-between"
        gap="$3"
        flexWrap="wrap"
      >
        <YStack gap="$1" flex={1} minW={0}>
          <Text
            fontSize="$4"
            fontWeight="700"
            color="$color12"
            numberOfLines={1}
          >
            {bill.number ?? "Bill"}
          </Text>
          <DateText value={bill.date} fallback="Date not recorded" />
        </YStack>
        <StatusPill label={status.label} theme={status.theme} />
      </XStack>

      {bill.lines.length > 0 ? (
        <YStack gap="$0.5">
          {wide ? <LineHeader /> : null}
          {bill.lines.map((line, i) => (
            <LineRow key={`${bill.id}-${i}`} line={line} wide={wide} />
          ))}
        </YStack>
      ) : (
        <Text fontSize="$2" color="$color9">
          Itemized charges are not available for this bill.
        </Text>
      )}

      <YStack gap="$1.5" pt="$2" borderTopWidth={1} borderColor="$borderColor">
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" color="$color10">
            Total
          </Text>
          <Money
            amount={bill.total}
            currency={CURRENCY}
            size="$4"
            weight="700"
            color="$color12"
          />
        </XStack>
        {bill.insurance ? null : (
          <XStack items="center" justify="space-between">
            <Text fontSize="$3" color="$color10">
              Paid
            </Text>
            <Money
              amount={bill.paid}
              currency={CURRENCY}
              size="$4"
              weight="600"
              color="$color10"
            />
          </XStack>
        )}
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" fontWeight="700" color="$color12">
            You owe
          </Text>
          <Theme name={bill.due > 0 ? "warning" : "success"}>
            <Money
              amount={bill.due}
              currency={CURRENCY}
              size="$5"
              weight="800"
              color="$color12"
            />
          </Theme>
        </XStack>
      </YStack>

      {bill.insurance ? <CoverageBlock insurance={bill.insurance} /> : null}
    </Panel>
  );
}

export default function Billing() {
  const media = useMedia();
  const wide = Boolean(media.md);
  const { data, isLoading, isError, refetch } = trpc.patientBills.useQuery(
    undefined,
    {
      retry: 1,
    },
  );

  if (isLoading) {
    return (
      <Screen>
        <Section title="Billing and insurance">
          <SkeletonList count={3} />
        </Section>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title="Could not load your bills"
          detail="We could not reach the billing records right now. Please try again."
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const bills = data ?? [];

  if (bills.length === 0) {
    return (
      <Screen>
        <EmptyState
          Icon={Receipt}
          title="No bills"
          detail="You have no billing records yet. Charges from your hospital visits will appear here."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Section title="Billing and insurance">
        <YStack gap="$4">
          <OutstandingHeader bills={bills} />
          <ViewOnlyNote />
          <YStack gap="$4">
            {bills.map((bill) => (
              <BillCard key={bill.id ?? bill.number} bill={bill} wide={wide} />
            ))}
          </YStack>
        </YStack>
      </Section>
    </Screen>
  );
}
