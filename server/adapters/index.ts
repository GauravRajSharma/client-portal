/**
 * Adapters: map raw backend payloads (Odoo RPC / OpenMRS REST / Bridge) -> app DTOs.
 *
 * Keep these pure and total: tolerate missing/odd fields, never throw on shape drift.
 * This is the ONLY layer that knows backend field names. If a backend changes, fix it
 * here and the UI is untouched. See server/dto/index.ts.
 */

import type {
  Bill,
  BillLine,
  ClaimEvent,
  Condition,
  InsuranceClaim,
  InsuranceCoverage,
  LabResult,
  LabStatus,
  LabTrend,
  Medication,
  Patient,
  Practitioner,
  Visit,
  VisitDetail,
  VisitType,
  Vital,
} from "../dto";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string | undefined =>
  v === false || v === null || v === undefined || v === ""
    ? undefined
    : String(v);

/** Normalize Odoo's `false`-for-empty into clean strings. */
export function clean<T extends string | undefined>(v: unknown): T {
  return str(v) as T;
}

export function toPatient(
  raw: any,
  hospitalName?: string,
  hospitalCode?: string,
): Patient {
  return {
    id: String(raw?.uuid ?? ""),
    mrn: String(raw?.ref ?? ""),
    name: String(raw?.name ?? ""),
    phone: str(raw?.mobile),
    insuranceNumber: str(raw?.nhis_number),
    hospital:
      hospitalCode || hospitalName
        ? { code: hospitalCode ?? "", name: hospitalName ?? "" }
        : undefined,
  };
}

/* ---- OpenMRS FHIR clinical-safety adapters ---- */

const fhirText = (codeable: any): string =>
  codeable?.text ?? codeable?.coding?.[0]?.display ?? "";

/**
 * toVitals — pick the latest reading per vital from FHIR Observations (newest-first input).
 * Tolerant of how a deployment encodes things: blood pressure as one Observation with
 * systolic/diastolic components OR as two separate observations; everything else as a
 * single valueQuantity. Classifies by the observation's display text so it survives
 * differing concept codings.
 */
export function toVitals(resources: any[]): Vital[] {
  const qty = (x: any): { v?: number; unit?: string } | undefined =>
    x?.valueQuantity?.value != null
      ? { v: num(x.valueQuantity.value), unit: str(x.valueQuantity.unit) }
      : undefined;
  const fmt = (n?: number) => (n == null ? "–" : String(Math.round(n * 10) / 10));

  const list = Array.isArray(resources) ? resources : [];

  // Blood pressure: take the newest with both parts available.
  let sys: number | undefined;
  let dia: number | undefined;
  let bpUnit: string | undefined;
  let bpDate: string | undefined;
  for (const o of list) {
    const t = fhirText(o?.code);
    const comps: any[] = Array.isArray(o?.component) ? o.component : [];
    const sc = comps.find((c) => /systolic/i.test(fhirText(c?.code)));
    const dc = comps.find((c) => /diastolic/i.test(fhirText(c?.code)));
    const isBp = /blood pressure|systolic|diastolic/i.test(t) || sc || dc;
    if (!isBp) continue;
    if (sys == null) {
      const v = sc ? num(sc.valueQuantity?.value) : /systolic/i.test(t) ? qty(o)?.v : undefined;
      if (v != null) {
        sys = v;
        bpUnit = (sc ? str(sc.valueQuantity?.unit) : qty(o)?.unit) ?? bpUnit;
        bpDate = str(o?.effectiveDateTime) ?? bpDate;
      }
    }
    if (dia == null) {
      const v = dc ? num(dc.valueQuantity?.value) : /diastolic/i.test(t) ? qty(o)?.v : undefined;
      if (v != null) dia = v;
    }
    if (sys != null && dia != null) break;
  }

  const vitals: Vital[] = [];
  const seen = new Set<string>();
  if (sys != null || dia != null) {
    vitals.push({
      key: "bp",
      label: "Blood pressure",
      value: `${fmt(sys)}/${fmt(dia)}`,
      unit: bpUnit ?? "mmHg",
      takenAt: bpDate,
    });
    seen.add("bp");
  }

  const defs = [
    { key: "pulse", label: "Pulse", re: /pulse|heart rate/i },
    { key: "temp", label: "Temperature", re: /temperature/i },
    { key: "spo2", label: "SpO₂", re: /spo2|spo₂|oxygen sat|o2 sat|saturation/i },
    { key: "resp", label: "Respiratory rate", re: /respirat/i },
    { key: "weight", label: "Weight", re: /weight/i },
    { key: "height", label: "Height", re: /height/i },
    { key: "bmi", label: "BMI", re: /bmi|body mass index/i },
  ];
  for (const o of list) {
    const t = fhirText(o?.code);
    const q = qty(o);
    if (!q || q.v == null) continue;
    for (const d of defs) {
      if (seen.has(d.key) || !d.re.test(t)) continue;
      vitals.push({ key: d.key, label: d.label, value: fmt(q.v), unit: q.unit, takenAt: str(o?.effectiveDateTime) });
      seen.add(d.key);
    }
  }

  const order = ["bp", "pulse", "temp", "spo2", "resp", "weight", "height", "bmi"];
  return vitals.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

/** toConditions — FHIR Condition resources -> problem-list DTOs (active first). */
export function toConditions(resources: any[]): Condition[] {
  const list = Array.isArray(resources) ? resources : [];
  const items = list.map(
    (c): Condition => ({
      id: String(c?.id ?? ""),
      name: fhirText(c?.code) || "Condition",
      clinicalStatus: str(c?.clinicalStatus?.coding?.[0]?.code),
      verificationStatus: str(c?.verificationStatus?.coding?.[0]?.code),
      onset: str(c?.onsetDateTime),
      recordedAt: str(c?.recordedDate),
    }),
  );
  const rank = (s?: string) => (s === "active" || s == null ? 0 : 1);
  return items.sort((a, b) => {
    const r = rank(a.clinicalStatus) - rank(b.clinicalStatus);
    if (r !== 0) return r;
    return (b.recordedAt ?? b.onset ?? "") > (a.recordedAt ?? a.onset ?? "") ? 1 : -1;
  });
}

/* ---- Insurance claim lifecycle (Odoo insurance.claim + .history) ---- */

/** insurance.claim / insurance.claim.history state -> plain-language label. */
export function claimStateLabel(state?: string): string {
  switch (state) {
    case "draft":
      return "Draft";
    case "confirmed":
      return "Confirmed";
    case "submitted_without_docs":
      return "Submitted (receipts pending)";
    case "submit_unconfirmed":
      return "Submitted (verifying)";
    case "submitted":
      return "Submitted";
    case "checked":
      return "Under review";
    case "valuated":
    case "passed":
      return "Approved";
    case "processed":
      return "Processed";
    case "rejected":
      return "Rejected";
    case "no-show":
      return "No show";
    default:
      return state ? String(state) : "—";
  }
}

/** Status pill tone for a claim state. */
function claimTone(state?: string): InsuranceClaim["tone"] {
  switch (state) {
    case "valuated":
    case "passed":
    case "processed":
      return "good";
    case "rejected":
    case "no-show":
      return "bad";
    case "submitted":
    case "submitted_without_docs":
    case "submit_unconfirmed":
    case "checked":
    case "confirmed":
      return "warn";
    default:
      return "neutral";
  }
}

const moneyOrUndef = (v: unknown): number | undefined => {
  const n = num(v);
  return n; // 0 is a legitimate amount; keep it
};

/**
 * toInsuranceClaim — one insurance.claim row + its history rows -> DTO.
 * History rows are this claim's only (filter upstream); sorted oldest-first here.
 */
export function toInsuranceClaim(raw: any, historyRows: any[] = []): InsuranceClaim {
  const currency = Array.isArray(raw?.currency_id) ? String(raw.currency_id[1]) : "NPR";
  const timeline: ClaimEvent[] = (historyRows ?? [])
    .map((h: any): ClaimEvent => ({
      state: String(h?.state ?? ""),
      label: claimStateLabel(h?.state),
      at: str(h?.create_date),
      note: str(h?.rejection_reason) ?? str(h?.claim_comments),
    }))
    .sort((a, b) => (a.at ?? "") < (b.at ?? "") ? -1 : 1);

  return {
    id: String(raw?.id ?? ""),
    claimCode: str(raw?.provider_claim_code) ?? str(raw?.claim_code),
    state: str(raw?.state),
    statusLabel: claimStateLabel(raw?.state),
    tone: claimTone(raw?.state),
    careType: raw?.care_type === "I" ? "Inpatient" : raw?.care_type === "O" ? "Outpatient" : undefined,
    claimedOn: str(raw?.claimed_date),
    receivedOn: str(raw?.claimed_received_date),
    claimedAmount: moneyOrUndef(raw?.claimed_amount_total),
    approvedAmount: moneyOrUndef(raw?.amount_approved_total),
    currency,
    rejectionReason: str(raw?.rejection_reason),
    timeline,
  };
}

export function toPractitioner(raw: any): Practitioner | undefined {
  if (!raw || raw.id === undefined) return undefined;
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    title: str(raw.specialized_title),
    licenseNumber: str(raw.license_number),
  };
}

const VISIT_TYPES: Record<string, { type: VisitType; label: string }> = {
  OPD: { type: "OPD", label: "Outpatient" },
  IPD: { type: "IPD", label: "Inpatient" },
  ER: { type: "ER", label: "Emergency" },
};

/**
 * patient.visit.display_name is "name — date — paymentType — paymentMethod".
 * We map what we can and degrade gracefully.
 */
export function toVisit(raw: any, doctorRaw?: any): Visit {
  const parts = String(raw?.display_name ?? "")
    .split("—")
    .map((s) => s.trim());
  const vt = VISIT_TYPES[raw?.visit_type] ?? {
    type: "OTHER" as const,
    label: "Visit",
  };
  return {
    id: String(raw?.external_uuid ?? raw?.id ?? ""),
    type: vt.type,
    typeLabel: vt.label,
    department: str(raw?.department),
    date: str(parts[1]) ?? str(raw?.create_date),
    doctor: toPractitioner(doctorRaw),
    paymentType: str(raw?.payment_type) ?? str(parts[2]),
    paymentMethod: str(raw?.payment_method) ?? str(parts[3]),
    status: raw?.manual_close_visit ? "closed" : "open",
  };
}

/**
 * Visit + the extra context a detail screen wants (diagnoses, counts). Builds on
 * toVisit so the base fields stay identical between list and detail.
 */
export function toVisitDetail(raw: any, doctorRaw?: any): VisitDetail {
  const base = toVisit(raw, doctorRaw);
  const diagnoses = Array.isArray(raw?.diagnoses)
    ? raw.diagnoses
        .map((d: any) =>
          Array.isArray(d) ? str(d[1]) : str(d?.name ?? d?.display ?? d),
        )
        .filter((d: string | undefined): d is string => Boolean(d))
    : undefined;
  return {
    ...base,
    diagnoses: diagnoses && diagnoses.length ? diagnoses : undefined,
  };
}

/**
 * Classify a lab value against reference + critical ranges. Order matters:
 * critical bounds are checked before normal bounds. Non-numeric values -> "unknown".
 */
export function computeLabStatus(
  value: number | undefined,
  meta: {
    lowNormal?: number;
    hiNormal?: number;
    lowCritical?: number;
    hiCritical?: number;
  },
): LabStatus {
  if (value === undefined || Number.isNaN(value)) return "unknown";
  const { lowNormal, hiNormal, lowCritical, hiCritical } = meta;
  if (lowCritical !== undefined && value < lowCritical) return "critical-low";
  if (hiCritical !== undefined && value > hiCritical) return "critical-high";
  if (lowNormal !== undefined && value < lowNormal) return "low";
  if (hiNormal !== undefined && value > hiNormal) return "high";
  if (lowNormal === undefined && hiNormal === undefined) return "unknown";
  return "normal";
}

export function toLabResult(raw: any, meta: any, panel?: string): LabResult {
  const numeric = num(raw?.value);
  // OpenMRS returns 0 (not null) for unset critical bounds. A literal 0 critical is
  // the "unset" sentinel, not a real threshold — treat it as absent, otherwise every
  // positive value reads as "critically high" and we alarm patients over normal labs.
  // ponytail: if a lab ever needs a genuine 0 critical bound, switch to an API presence flag.
  const nzCrit = (v: unknown): number | undefined => {
    const n = num(v);
    return n === 0 ? undefined : n;
  };
  const m = {
    lowNormal: num(meta?.lowNormal),
    hiNormal: num(meta?.hiNormal),
    lowCritical: nzCrit(meta?.lowCritical),
    hiCritical: nzCrit(meta?.hiCritical),
  };
  return {
    id: String(raw?.id ?? ""),
    name: Array.isArray(raw?.lab_item)
      ? String(raw.lab_item[1])
      : String(raw?.name ?? ""),
    value: String(raw?.value ?? ""),
    numericValue: numeric,
    unit: str(meta?.units),
    referenceLow: m.lowNormal,
    referenceHigh: m.hiNormal,
    criticalLow: m.lowCritical,
    criticalHigh: m.hiCritical,
    status: computeLabStatus(numeric, m),
    takenAt: str(raw?.create_date),
    panel: str(panel),
  };
}

/**
 * Build per-analyte trends from a flat list of LabResult. Groups by analyte `name`,
 * keeps only points with a numeric value and a date, and sorts oldest -> newest so a
 * Sparkline reads left (past) to right (latest). Reference range is taken from the most
 * recent point (ranges rarely drift; the latest is the most relevant to the patient).
 */
export function toLabTrends(results: LabResult[]): LabTrend[] {
  const groups = new Map<string, LabResult[]>();
  for (const r of results) {
    if (!r.name) continue;
    const list = groups.get(r.name) ?? [];
    list.push(r);
    groups.set(r.name, list);
  }

  const trends: LabTrend[] = [];
  for (const [name, list] of groups) {
    const sorted = [...list].sort(
      (a, b) => dateMs(a.takenAt) - dateMs(b.takenAt),
    );
    const points = sorted
      .filter((r) => r.numericValue !== undefined && r.takenAt)
      .map((r) => ({ date: r.takenAt as string, value: r.numericValue as number }));
    if (!points.length) continue;
    const latest = sorted[sorted.length - 1];
    trends.push({
      name,
      unit: latest.unit,
      referenceLow: latest.referenceLow,
      referenceHigh: latest.referenceHigh,
      points,
    });
  }
  return trends;
}

/** Parse a loose date to epoch ms; undefined/bad dates sort to the start. */
function dateMs(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function toMedication(raw: any): Medication {
  const conceptDisplay: string | undefined = raw?.drug?.concept?.display;
  const name =
    (conceptDisplay && conceptDisplay.split(" / ")[1]) ||
    conceptDisplay ||
    raw?.drug?.display ||
    "Medication";
  return {
    id: String(raw?.uuid ?? ""),
    name,
    strength: str(raw?.drug?.strength),
    form: str(raw?.drug?.dosageForm?.display)?.toLowerCase(),
    dose: raw?.dose !== undefined ? String(raw.dose) : undefined,
    doseUnit: str(raw?.doseUnits?.display)?.toLowerCase(),
    route: str(raw?.route?.display)?.toLowerCase(),
    frequency: str(raw?.frequency?.display)?.toLowerCase(),
    durationLabel: raw?.duration
      ? `${raw.duration} ${str(raw?.durationUnits?.display)?.toLowerCase() ?? ""}`.trim()
      : "indefinite",
    refills: num(raw?.numRefills),
    instructions: str(raw?.dosingInstructions) ?? str(raw?.instructions),
    active: raw?.action !== "DISCONTINUE",
  };
}

/* ---------------------------------------------------------------------------
 * Billing & insurance (read-only).
 *
 * Sources (Odoo, all read via search_read):
 *   account.move        — the invoice: amount_total, amount_residual (due),
 *                         payment_state, state, invoice_date, name, claim_code,
 *                         care_type. Filtered by partner_id.uuid = patient.
 *   account.move.line   — itemized lines: name, quantity, price_unit,
 *                         price_subtotal, price_total, product_id.
 *   who.insurance.claim_code_audit — links a move to its patient.visit and
 *                         carries the claim_code / nhis_number for context.
 *
 * Money note: account.move.amount_total/amount_residual are stored as POSITIVE
 * on customer invoices (out_invoice). amount_paid is derived as total - residual.
 * Coverage is presented conservatively: what is already settled vs what the
 * patient still owes. We do NOT invent insurer-approved amounts the backend has
 * not confirmed; the view degrades to showing what is known.
 * ------------------------------------------------------------------------- */

/** Clamp a maybe-number to a finite, non-negative amount (defaulting to 0). */
const money = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

/** A many2one in Odoo RPC comes back as [id, "Display Name"] or false. */
const m2oLabel = (v: unknown): string | undefined =>
  Array.isArray(v) && v.length >= 2 ? str(v[1]) : undefined;

/**
 * Human-readable insurance scheme label. The system only speaks one insurer
 * family today (Nepal's National Health Insurance, run by the Health Insurance
 * Board), so we present a stable, layperson label rather than leaking internal
 * policy codes like "HIB-3500".
 */
const SCHEME_LABEL = "National Health Insurance (HIB)";

export function toBillLine(raw: any): BillLine {
  const qty = num(raw?.quantity);
  const unit = num(raw?.price_unit);
  // Prefer tax-inclusive total so the line amounts reconcile with the bill total.
  const amount = money(raw?.price_total ?? raw?.price_subtotal);
  return {
    description: str(raw?.name) ?? m2oLabel(raw?.product_id) ?? "Charge",
    quantity: qty,
    unitPrice: unit,
    amount,
    category: m2oLabel(raw?.product_id),
  };
}

/**
 * Build the insurance coverage block for one invoice, when there is any signal
 * that insurance is involved (a claim code, or the patient carries an NHIS id).
 * Returns undefined for a plain cash bill so the UI shows no coverage block.
 *
 * covered        = what has been settled against the bill (total - due).
 * patientPayable = what the patient still owes (the residual).
 * This is the honest, backend-confirmed split; insurer-approved valuations are
 * not reliably persisted at view time, so we do not fabricate them.
 */
export function toInsuranceCoverage(
  invoiceRaw: any,
  opts: { nhisNumber?: string; total: number; due: number },
): InsuranceCoverage | undefined {
  const claimCode = str(invoiceRaw?.claim_code);
  const hasInsuranceSignal = Boolean(claimCode) || Boolean(opts.nhisNumber);
  if (!hasInsuranceSignal) return undefined;

  const covered = Math.max(0, opts.total - opts.due);
  return {
    scheme: SCHEME_LABEL,
    number: opts.nhisNumber,
    claimCode,
    covered,
    patientPayable: opts.due,
    status: str(invoiceRaw?.payment_state)
      ? paymentStateLabel(invoiceRaw.payment_state)
      : undefined,
  };
}

/** Plain-language label for Odoo's account.move.payment_state. */
export function paymentStateLabel(state: unknown): string {
  switch (String(state)) {
    case "paid":
      return "Settled";
    case "in_payment":
      return "Payment in progress";
    case "partial":
      return "Partially settled";
    case "reversed":
      return "Reversed";
    case "not_paid":
      return "Awaiting settlement";
    default:
      return "—";
  }
}

/**
 * Map one Odoo invoice (+ its lines) to a Bill DTO. Tolerant of `false`-empties
 * and missing lines; never throws on shape drift.
 */
const CARE_TYPE: Record<string, "Outpatient" | "Inpatient"> = {
  O: "Outpatient",
  I: "Inpatient",
};

export function toBill(
  invoiceRaw: any,
  lineRaws: any[] | undefined,
  opts: { nhisNumber?: string; visitId?: string; orderedBy?: string } = {},
): Bill {
  const total = money(invoiceRaw?.amount_total);
  const due = money(invoiceRaw?.amount_residual);
  const paid = Math.max(0, total - due);
  const lines = Array.isArray(lineRaws) ? lineRaws.map(toBillLine) : [];
  const kind = str(invoiceRaw?.move_type) === "out_refund" ? "refund" : "invoice";
  const claimCode = str(invoiceRaw?.claim_code);
  return {
    id: str(invoiceRaw?.id) ?? str(invoiceRaw?.name),
    visitId: opts.visitId ?? str(invoiceRaw?.name),
    kind,
    number: str(invoiceRaw?.name),
    date: str(invoiceRaw?.invoice_date) ?? str(invoiceRaw?.date),
    careType: CARE_TYPE[String(invoiceRaw?.care_type)],
    claimCode,
    orderedBy: opts.orderedBy,
    paymentStatus: paymentStateLabel(invoiceRaw?.payment_state),
    currency: str(invoiceRaw?.currency_id?.[1]) === "USD" ? "USD" : "NPR",
    total,
    paid,
    due,
    // A refund returns money to the patient, so it never adds to what they owe.
    lines,
    insurance: toInsuranceCoverage(invoiceRaw, {
      nhisNumber: opts.nhisNumber,
      total,
      due,
    }),
  };
}
