/**
 * Adapters: map raw backend payloads (Odoo RPC / OpenMRS REST / Bridge) -> app DTOs.
 *
 * Keep these pure and total: tolerate missing/odd fields, never throw on shape drift.
 * This is the ONLY layer that knows backend field names. If a backend changes, fix it
 * here and the UI is untouched. See server/dto/index.ts.
 */

import type {
  LabResult,
  LabStatus,
  LabTrend,
  Medication,
  Patient,
  Practitioner,
  Visit,
  VisitDetail,
  VisitType,
} from "../dto";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string | undefined =>
  v === false || v === null || v === undefined || v === "" ? undefined : String(v);

/** Normalize Odoo's `false`-for-empty into clean strings. */
export function clean<T extends string | undefined>(v: unknown): T {
  return str(v) as T;
}

export function toPatient(raw: any, hospitalName?: string, hospitalCode?: string): Patient {
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
  const vt = VISIT_TYPES[raw?.visit_type] ?? { type: "OTHER" as const, label: "Visit" };
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
  const m = {
    lowNormal: num(meta?.lowNormal),
    hiNormal: num(meta?.hiNormal),
    lowCritical: num(meta?.lowCritical),
    hiCritical: num(meta?.hiCritical),
  };
  return {
    id: String(raw?.id ?? ""),
    name: Array.isArray(raw?.lab_item) ? String(raw.lab_item[1]) : String(raw?.name ?? ""),
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
