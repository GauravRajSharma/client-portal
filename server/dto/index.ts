/**
 * App-owned Data Transfer Objects.
 *
 * The UI and tRPC procedures speak ONLY these shapes — never raw Odoo / OpenMRS /
 * Bridge payloads. When a backend changes how it feeds data, only the adapters in
 * `server/adapters/` change; the DTOs (and therefore the whole UI) stay stable.
 *
 * Everything here is read-only by design. There are no "input"/"write" DTOs.
 */

export type VisitType = "OPD" | "IPD" | "ER" | "OTHER";

/* ---- Public (pre-login) search DTOs ---- */

/** A doctor as shown publicly: name, NMC/license, title, and which hospitals. No PII. */
export interface PublicDoctor {
  name: string;
  license?: string;
  title?: string;
  /** hospital codes/prefixes where this doctor practises */
  hospitals: string[];
}

/** Per-hospital bed availability (counts only — never any patient information). */
export interface BedAvailability {
  /** hospital code/prefix */
  hospital: string;
  hospitalName?: string;
  total: number;
  occupied: number;
  free: number;
  types: { type: string; total: number; occupied: number; free: number }[];
}

export type LabStatus =
  | "normal"
  | "low"
  | "high"
  | "critical-low"
  | "critical-high"
  | "unknown";

export interface Hospital {
  /** short MRN prefix / server key, e.g. "gpkm" */
  code: string;
  name: string;
}

export interface Practitioner {
  id: number;
  name: string;
  title?: string;
  licenseNumber?: string;
}

export interface Patient {
  id: string; // uuid
  mrn: string; // res.partner.ref
  name: string;
  gender?: "M" | "F" | "O";
  age?: number;
  dateOfBirth?: string; // ISO
  phone?: string;
  insuranceNumber?: string;
  hospital?: Hospital;
}

export interface Visit {
  id: string; // external_uuid
  type: VisitType;
  typeLabel: string;
  department?: string;
  date?: string; // ISO or display
  doctor?: Practitioner;
  paymentType?: string;
  paymentMethod?: string;
  status: "open" | "closed";
}

export interface VisitDetail extends Visit {
  diagnoses?: string[];
  labResultCount?: number;
  prescriptionAvailable?: boolean;
  billTotalDue?: number;
}

export interface LabResult {
  id: string;
  name: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  status: LabStatus;
  takenAt?: string; // ISO
  panel?: string;
}

export interface LabTrendPoint {
  date: string; // ISO
  value: number;
}

export interface LabTrend {
  name: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  points: LabTrendPoint[];
}

export interface Medication {
  id: string;
  name: string;
  strength?: string;
  form?: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  frequency?: string;
  durationLabel?: string;
  refills?: number;
  instructions?: string;
  active: boolean;
}

/**
 * Prescription is rendered HTML today. Kept behind a DTO so we can switch to a
 * structured (medication-list) shape later without touching the UI's contract.
 */
export interface Prescription {
  visitId: string;
  html: string;
}

export interface BillLine {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  category?: string;
}

export interface InsuranceCoverage {
  scheme: string; // e.g. "NHIS / HIB"
  number?: string;
  claimCode?: string;
  covered: number;
  patientPayable: number;
  status?: string;
}

export interface Bill {
  /** Stable id for keys/grouping (invoice id, falls back to number). */
  id?: string;
  visitId?: string;
  /** "invoice" (a charge) or "refund" (a reversal / money back to the patient). */
  kind: "invoice" | "refund";
  /** Human invoice number, e.g. "INV/2026/00123". */
  number?: string;
  /** ISO/display date the invoice was issued. */
  date?: string;
  /** Outpatient / Inpatient, from Odoo care_type (O/I). */
  careType?: "Outpatient" | "Inpatient";
  /** Insurance claim number submitted to the scheme, if this bill was claimed. */
  claimCode?: string;
  /** Doctor who ordered the claimed care (resolved via the claim's visit). */
  orderedBy?: string;
  /** Plain-language settlement status, e.g. "Settled", "Awaiting settlement". */
  paymentStatus?: string;
  currency: string; // "NPR"
  total: number;
  paid: number;
  due: number;
  lines: BillLine[];
  insurance?: InsuranceCoverage;
}

/** One state transition in a claim's life (insurance.claim.history). */
export interface ClaimEvent {
  /** machine state, e.g. "submitted" */
  state: string;
  /** plain-language label, e.g. "Submitted" */
  label: string;
  at?: string; // ISO (history row create date)
  note?: string; // comments / rejection reason at that step
}

/**
 * An NHIS / HIB insurance claim and its lifecycle (Odoo insurance.claim +
 * insurance.claim.history). Read-only; amounts are exactly what the backend stored.
 */
export interface InsuranceClaim {
  id: string;
  /** the claim code (provider code once HIB returns it, else our internal code) */
  claimCode?: string;
  /** machine state, e.g. "valuated" */
  state?: string;
  /** plain-language status, e.g. "Approved", "Under review" */
  statusLabel: string;
  /** good | warn | bad | neutral — for the status pill */
  tone: "good" | "warn" | "bad" | "neutral";
  careType?: "Inpatient" | "Outpatient";
  claimedOn?: string; // ISO
  receivedOn?: string; // ISO
  claimedAmount?: number;
  approvedAmount?: number;
  currency: string; // "NPR"
  rejectionReason?: string;
  /** state-transition history, oldest first */
  timeline: ClaimEvent[];
}

/**
 * Last known NHIS / HIB balance. The live balance lives in IMIS and is NOT stored per
 * patient — Odoo only snapshots it onto each claim at creation. So this is the snapshot
 * from the patient's most recent claim, labelled with the date it was taken. Absent when
 * the patient has no claims (we never invent a balance).
 */
export interface NhisBalance {
  number?: string;
  /** total insurance balance snapshot at the last claim */
  totalBalance?: number;
  /** balance for the selected benefit policy at the last claim */
  benefitBalance?: number;
  /** ISO date this snapshot was taken (the claim's date) */
  asOf?: string;
  currency: string; // "NPR"
}

/**
 * PatientOverview — a read-only aggregate for the Home screen. It composes data the
 * patient most needs at a glance, so Home makes one call instead of fanning out:
 *  - latest visit
 *  - the lab results currently worth their attention (out of range), with a total
 *  - how many medicines are active, with a few names to recognise
 *
 * Each field is derived from an existing read-only backend call via the adapters.
 */
export interface PatientOverview {
  latestVisit?: Visit;
  labs: {
    /** results out of reference range, most recent first, capped for the summary */
    attention: LabResult[];
    /** how many results are out of range in total (attention may be truncated) */
    attentionCount: number;
    /** total results we have on record */
    total: number;
  };
  medications: {
    activeCount: number;
    /** a few active medicine names, for recognition */
    sampleNames: string[];
  };
}

/** A recorded allergy / intolerance (OpenMRS FHIR AllergyIntolerance). */
export interface Allergy {
  id: string;
  substance: string;
  /** FHIR criticality: low | high | unable-to-assess */
  criticality?: string;
  /** allergy categories, e.g. medication / food / environment */
  categories: string[];
  reactions: string[];
}

/**
 * A latest vital sign reading (OpenMRS FHIR Observation, category vital-signs).
 * `value` is a display string ("120/80", "72", "36.8") so blood pressure and single
 * metrics share one shape; the screen never parses it.
 */
export interface Vital {
  /** stable metric key: bp | pulse | temp | spo2 | resp | weight | height | bmi */
  key: string;
  label: string;
  value: string;
  unit?: string;
  takenAt?: string; // ISO
}

/** An active/past problem (OpenMRS FHIR Condition). */
export interface Condition {
  id: string;
  name: string;
  /** FHIR clinical status: active | inactive | resolved | recurrence | remission */
  clinicalStatus?: string;
  /** FHIR verification status: confirmed | provisional | differential | unconfirmed */
  verificationStatus?: string;
  onset?: string; // ISO
  recordedAt?: string; // ISO
}

export type ImagingModality =
  | "usg"
  | "xray"
  | "mri"
  | "ct"
  | "dental"
  | "mammo"
  | "fluoro"
  | "other";

/** One rendered picture from a study, addressed through the portal's own image proxy. */
export interface ImagingImage {
  /** full-size rendered image URL (portal proxy, safe to cache/download) */
  url: string;
  /** smaller rendered image URL for list/grid previews */
  thumbUrl: string;
}

/** A radiology order and, when the modality produces pictures, its rendered images. */
export interface ImagingStudy {
  /** OpenMRS order uuid */
  orderId: string;
  /** order/accession number, e.g. "ORD-251595" */
  orderNumber: string;
  /** human study name from the order concept, e.g. "X-ray Chest PA View" */
  name: string;
  modality: ImagingModality;
  date?: string;
  /** plain-language fulfilment status, e.g. "Completed", "In progress" */
  status?: string;
  /** true when a DICOM study with viewable images exists */
  hasImages: boolean;
  /** true for modalities that deliver a written report only (e.g. ultrasound) */
  reportOnly: boolean;
  imageCount: number;
  images: ImagingImage[];
}

/** One step in the live "care in progress" journey. */
export interface CareStep {
  key: string;
  label: string;
  /** richer one-line description of what happened at this step */
  detail?: string;
  /** when this step happened (ISO), if known */
  at?: string;
  status: "completed" | "current" | "pending";
}

/**
 * CareStatus — a read-only "where am I in my hospital visit right now" snapshot, like a
 * ride-share active-trip panel. Derived from the patient's own open visit (Odoo) enriched
 * with the bridge throughput model. Absent/closed visit -> { active: false }.
 */
export interface CareStatus {
  active: boolean;
  visitId?: string;
  /** opd | ipd | er | general */
  workflow?: string;
  department?: string;
  /** ISO start of the visit */
  since?: string;
  durationHours?: number;
  /** true while the model still believes the patient is physically in the hospital */
  inHospital?: boolean;
  /** current stage label, e.g. "Waiting for investigation fulfillment" */
  stage?: string;
  /** one-line plain explanation of the current stage */
  stageDetail?: string;
  /** ordered journey steps (completed / current / pending) */
  steps: CareStep[];
  /** how many items are still pending, by service */
  pending: { lab: number; radiology: number; procedure: number; medication: number };
  /** live admission context (patient-scoped) — present while currently admitted */
  live?: {
    isWard?: boolean;
    /** current inpatient location / ward, e.g. "Inpatient (IPD)" */
    ward?: string;
  };
}

/**
 * A written report (radiology / procedure findings, etc.), stored in OpenMRS as a
 * result observation whose value is HTML. Rendered full-page in the document viewer.
 */
export interface PatientReport {
  id: string;
  /** report name from the concept, e.g. "Radiology results", "USG Report" */
  title: string;
  date?: string;
  /** report body as HTML */
  html: string;
}

export type DocumentKind = "summary" | "prescription" | "lab" | "report";

export interface PatientDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  url: string;
  format: "pdf" | "html";
}
