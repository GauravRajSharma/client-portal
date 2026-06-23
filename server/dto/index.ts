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
  visitId?: string;
  currency: string; // "NPR"
  total: number;
  paid: number;
  due: number;
  lines: BillLine[];
  insurance?: InsuranceCoverage;
}

export type DocumentKind = "summary" | "prescription" | "lab" | "report";

export interface PatientDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  url: string;
  format: "pdf" | "html";
}
