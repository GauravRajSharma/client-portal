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
