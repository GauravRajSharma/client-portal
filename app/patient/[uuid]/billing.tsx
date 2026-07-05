import { useMemo } from "react";
import { Info, Receipt, ShieldCheck, C } from "@/components/ui/icons";
import { HStack, VStack, Text, useMedia } from "@/components/ui/gs";
import type { Bill, BillLine } from "@/server/dto";
import {
  DLCard,
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

const cx = (...p: (string | undefined | false | null)[]) => p.filter(Boolean).join(" ");

function billStatus(b: Bill): { label: string; text: string; softBg: string; hex: string } {
  if (b.due <= 0 && b.total > 0) return { label: "Settled", text: "text-good", softBg: "bg-goodSoft", hex: C.good };
  if (b.due > 0 && b.paid > 0) return { label: "Partly paid", text: "text-warn", softBg: "bg-warnSoft", hex: C.warn };
  if (b.due > 0) return { label: "Due", text: "text-warn", softBg: "bg-warnSoft", hex: C.warn };
  return { label: b.paymentStatus ?? "—", text: "text-text3", softBg: "bg-surface3", hex: C.text3 };
}

/** Odoo amount is tax-inclusive while unitPrice is pre-tax, so only show the
 *  "qty × unit" hint when it genuinely reconciles (within rounding). */
function reconciles(line: BillLine): boolean {
  if (line.quantity === undefined || line.unitPrice === undefined) return false;
  return Math.abs(line.quantity * line.unitPrice - line.amount) < 0.5;
}

function Money({ amount, className }: { amount?: number; className?: string }) {
  return (
    <Text className={cx("font-plex-mono tracking-[-0.3px]", className)} style={{ fontVariant: ["tabular-nums"] }}>
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
    <DLCard className="p-[17px] gap-[15px]">
      <HStack className="items-start justify-between gap-[12px]">
        <VStack className="gap-[4px]">
          <Text className="text-[12.5px] font-plex-semibold text-text2">
            Outstanding balance
          </Text>
          <Text className={cx("text-[36px] font-plex-bold font-plex-mono tracking-[-1.5px]", settled ? "text-good" : "text-fg")}>
            {dlMoney(totals.due, CCY)}
          </Text>
        </VStack>
        {settled ? (
          <DLStatusPill label="All settled" text="text-good" softBg="bg-goodSoft" hex={C.good} />
        ) : (
          <DLStatusPill label="Payment due" text="text-warn" softBg="bg-warnSoft" hex={C.warn} />
        )}
      </HStack>
      <HStack className="gap-[30px] pt-[12px] border-t border-border flex-wrap">
        <VStack className="gap-[2px]">
          <Text className="text-[11.5px] text-text2">
            Total billed
          </Text>
          <Money amount={totals.billed} className="text-[15px] font-plex-bold text-fg" />
        </VStack>
        <VStack className="gap-[2px]">
          <Text className="text-[11.5px] text-text2">
            Paid or covered
          </Text>
          <Money amount={totals.paid} className="text-[15px] font-plex-bold text-fg" />
        </VStack>
      </HStack>
    </DLCard>
  );
}

function LineRow({ line, wide }: { line: BillLine; wide: boolean }) {
  if (wide) {
    return (
      <HStack className="items-center gap-[12px] py-[7px]">
        <Text className="flex-1 text-[13px] text-fg" numberOfLines={2}>
          {line.description}
        </Text>
        <Text className="w-[44px] text-right text-[13px] text-text2 font-plex-mono">
          {line.quantity ?? "—"}
        </Text>
        <VStack className="w-[120px] items-end">
          <Money amount={line.unitPrice} className="text-[13px] font-plex-medium text-text2" />
        </VStack>
        <VStack className="w-[130px] items-end">
          <Money amount={line.amount} className="text-[13px] font-plex-bold text-fg" />
        </VStack>
      </HStack>
    );
  }
  return (
    <HStack className="items-start justify-between gap-[12px] py-[7px]">
      <VStack className="flex-1 min-w-0 gap-[1px]">
        <Text className="text-[13px] text-fg">
          {line.description}
        </Text>
        {reconciles(line) ? (
          <Text className="text-[11.5px] text-text3 font-plex-mono">
            {line.quantity} × {dlMoney(line.unitPrice, CCY)}
          </Text>
        ) : line.quantity !== undefined && line.quantity !== 1 ? (
          <Text className="text-[11.5px] text-text3 font-plex-mono">
            Qty {line.quantity}
          </Text>
        ) : null}
      </VStack>
      <Money amount={line.amount} className="text-[13px] font-plex-bold text-fg" />
    </HStack>
  );
}

function LineHeader() {
  return (
    <HStack className="items-center gap-[12px] pb-[4px] border-b border-border">
      <Text className="flex-1 text-[10.5px] font-plex-bold text-text3 uppercase tracking-[0.3px]">
        Item
      </Text>
      <Text className="w-[44px] text-right text-[10.5px] font-plex-bold text-text3 uppercase">
        Qty
      </Text>
      <Text className="w-[120px] text-right text-[10.5px] font-plex-bold text-text3 uppercase">
        Unit
      </Text>
      <Text className="w-[130px] text-right text-[10.5px] font-plex-bold text-text3 uppercase">
        Amount
      </Text>
    </HStack>
  );
}

function CoverageBlock({ insurance }: { insurance: NonNullable<Bill["insurance"]> }) {
  return (
    <VStack className="gap-[10px] p-[15px] rounded-[13px] bg-surface2 border border-border">
      <HStack className="items-center gap-[7px]">
        <ShieldCheck size={16} color={C.primary} />
        <Text className="text-[13.5px] font-plex-bold text-fg">
          {insurance.scheme}
        </Text>
      </HStack>
      <HStack className="gap-[30px] flex-wrap">
        {insurance.number ? (
          <VStack className="gap-[1px]">
            <Text className="text-[11px] text-text2">
              Member number
            </Text>
            <Text className="text-[12.5px] font-plex-semibold text-fg font-plex-mono">
              {insurance.number}
            </Text>
          </VStack>
        ) : null}
        {insurance.claimCode ? (
          <VStack className="gap-[1px]">
            <Text className="text-[11px] text-text2">
              Claim code
            </Text>
            <Text className="text-[12.5px] font-plex-semibold text-fg font-plex-mono">
              {insurance.claimCode}
            </Text>
          </VStack>
        ) : null}
        {insurance.status ? (
          <VStack className="gap-[1px]">
            <Text className="text-[11px] text-text2">
              Status
            </Text>
            <Text className="text-[12.5px] font-plex-semibold text-fg">
              {insurance.status}
            </Text>
          </VStack>
        ) : null}
      </HStack>
      <HStack className="gap-[12px] pt-[10px] border-t border-border flex-wrap">
        <VStack className="flex-1 min-w-[130px] gap-[2px]">
          <Text className="text-[11.5px] text-text2">
            Paid or covered
          </Text>
          <Money amount={insurance.covered} className="text-[15px] font-plex-bold text-good" />
        </VStack>
        <VStack className="flex-1 min-w-[130px] gap-[2px]">
          <Text className="text-[11.5px] text-text2">
            Your share to pay
          </Text>
          <Money amount={insurance.patientPayable} className={cx("text-[15px] font-plex-bold", insurance.patientPayable > 0 ? "text-warn" : "text-good")} />
        </VStack>
      </HStack>
    </VStack>
  );
}

function BillCard({ bill, wide }: { bill: Bill; wide: boolean }) {
  const status = billStatus(bill);
  const isRefund = bill.kind === "refund";
  return (
    <DLCard className="p-[17px] gap-[12px]">
      <HStack className="items-start justify-between gap-[12px] flex-wrap">
        <VStack className="gap-[2px] flex-1 min-w-0">
          <Text className="text-[14.5px] font-plex-bold text-fg" numberOfLines={1}>
            {bill.number ?? "Bill"}
          </Text>
          <HStack className="items-center gap-[7px] flex-wrap">
            {bill.date ? (
              <Text className="text-[12px] text-text2">
                {bill.date.slice(0, 10)}
              </Text>
            ) : null}
            {bill.careType ? (
              <Text className="text-[11.5px] font-plex-semibold text-text3">
                {bill.careType}
              </Text>
            ) : null}
          </HStack>
        </VStack>
        <VStack className="items-end gap-[4px]">
          {isRefund ? <DLStatusPill label="Refund" text="text-primary" softBg="bg-primarySoft" hex={C.primary} size="sm" /> : null}
          <DLStatusPill label={status.label} text={status.text} softBg={status.softBg} hex={status.hex} size="sm" />
        </VStack>
      </HStack>

      {bill.claimCode || bill.orderedBy ? (
        <HStack className="items-center gap-[7px] bg-primarySoft rounded-[10px] px-[12px] py-[7px] flex-wrap">
          <ShieldCheck size={14} color={C.primary} />
          {bill.claimCode ? (
            <Text className="text-[11.5px] font-plex-semibold text-primary font-plex-mono">
              Claim {bill.claimCode}
            </Text>
          ) : (
            <Text className="text-[11.5px] font-plex-semibold text-primary">
              Insurance claim
            </Text>
          )}
          {bill.orderedBy ? (
            <Text className="text-[11.5px] text-primary">
              · {bill.orderedBy}
            </Text>
          ) : null}
        </HStack>
      ) : null}

      {bill.lines.length > 0 ? (
        <VStack className="gap-[1px]">
          {wide ? <LineHeader /> : null}
          {bill.lines.map((line, i) => (
            <LineRow key={`${bill.id}-${i}`} line={line} wide={wide} />
          ))}
        </VStack>
      ) : (
        <Text className="text-[12.5px] text-text3">
          Itemized charges are not available for this bill.
        </Text>
      )}

      <VStack className="gap-[4px] pt-[10px] border-t border-border">
        <HStack className="items-center justify-between">
          <Text className="text-[13px] text-text2">
            Total
          </Text>
          <Money amount={bill.total} className="text-[14px] font-plex-bold text-fg" />
        </HStack>
        {bill.insurance ? null : (
          <HStack className="items-center justify-between">
            <Text className="text-[13px] text-text2">
              Paid
            </Text>
            <Money amount={bill.paid} className="text-[14px] font-plex-semibold text-text2" />
          </HStack>
        )}
        <HStack className="items-center justify-between">
          <Text className="text-[13.5px] font-plex-bold text-fg">
            You owe
          </Text>
          <Money amount={bill.due} className={cx("text-[17px] font-plex-bold", bill.due > 0 ? "text-warn" : "text-good")} />
        </HStack>
      </VStack>

      {bill.insurance ? <CoverageBlock insurance={bill.insurance} /> : null}
    </DLCard>
  );
}

export default function Billing() {
  const media = useMedia();
  const wide = Boolean(media.md);
  const { data, isLoading, isError, refetch } = trpc.patientBills.useQuery(undefined, { retry: 1 });

  return (
    <DLScreen>
      <DLTitle title="Billing" subtitle="Your charges and insurance coverage." />

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
        <VStack className="gap-[15px]">
          <OutstandingHeader bills={data} />
          <HStack className="items-center gap-[10px] px-[15px] py-[10px] rounded-[12px] bg-surface2 border border-border">
            <Info size={15} color={C.text3} />
            <Text className="flex-1 text-[12px] text-text2 leading-[17px]">
              This is a view of your charges and insurance. It is read only. To pay or ask about a charge, contact the hospital billing desk.
            </Text>
          </HStack>
          {data.map((bill) => (
            <BillCard key={bill.id ?? bill.number} bill={bill} wide={wide} />
          ))}
        </VStack>
      )}
    </DLScreen>
  );
}
