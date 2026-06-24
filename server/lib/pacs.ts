/**
 * PACS helpers — discover a radiology order's DICOM study and turn it into rendered
 * image references the patient portal can show. Read-only.
 *
 * Path confirmed against live deployments (lamj):
 *  - QIDO study by accession: /openmrs/pacs/dicom-web/studies?00080050={orderNumber}
 *    -> StudyInstanceUID at tag 0020000D
 *  - QIDO instances:          /openmrs/pacs/dicom-web/studies/{study}/instances
 *    -> SeriesInstanceUID 0020000E, SOPInstanceUID 00080018
 *  - Rendered image (WADO-URI, returns PNG/JPEG ~300KB):
 *    /openmrs/pacs/wado?requestType=WADO&studyUID=&seriesUID=&objectUID=&contentType=image/jpeg
 *    (DICOMweb WADO-RS /rendered is NOT supported here — it 400s.)
 *
 * Image URLs are signed (JWT, no expiry so they stay cacheable on-device) and served
 * through the portal's own /api/pacs/render route, never straight from PACS.
 */
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import type { ImagingImage, ImagingModality } from "../dto";

const PACS_MODALITIES = new Set<ImagingModality>([
  "xray",
  "ct",
  "mri",
  "mammo",
  "fluoro",
  "dental",
]);

export const isPacsModality = (m: ImagingModality) => PACS_MODALITIES.has(m);

/** Infer modality from the order's concept name (ported from esm-radiology-app). */
export function modalityFromConcept(display = ""): ImagingModality {
  const s = display.toLowerCase();
  if (/\b(usg|ultrasound|sonograph|doppler|echo)\b/.test(s)) return "usg";
  if (/\b(mri|magnetic resonance)\b/.test(s)) return "mri";
  if (/\b(ct|computed tomography|cat scan)\b/.test(s)) return "ct";
  if (/\b(dental|opg|panoram)\b/.test(s)) return "dental";
  if (/\b(mammo|mammogra)\b/.test(s)) return "mammo";
  if (/\b(fluoro|barium|ivu|ivp)\b/.test(s)) return "fluoro";
  if (/\b(x[-\s]*ray|xray|radiograph|chest film|kub)\b/.test(s)) return "xray";
  return "other";
}

/** What the portal's image proxy needs to fetch one rendered picture. */
export interface ImageRef {
  server: string;
  study: string;
  series: string;
  sop: string;
}

type RawClient = { raw: (path: string, opts?: any) => Promise<any> };

async function qidoJson(client: RawClient, path: string): Promise<any> {
  const r = await client.raw(path, {
    responseType: "json",
    headers: { Accept: "application/dicom+json" },
  });
  return r._data;
}

/** Resolve an order/accession number to its StudyInstanceUID, or null. */
export async function findStudyUid(
  client: RawClient,
  orderNumber: string,
): Promise<string | null> {
  const q = async (n: string): Promise<string | null> => {
    try {
      const d = await qidoJson(
        client,
        `/openmrs/pacs/dicom-web/studies?00080050=${encodeURIComponent(n)}`,
      );
      return Array.isArray(d) && d[0] ? (d[0]["0020000D"]?.Value?.[0] ?? null) : null;
    } catch {
      return null;
    }
  };
  // Retry without dashes (legacy PACS importer stripped them).
  return (await q(orderNumber)) ?? (await q(orderNumber.replaceAll("-", "")));
}

/** List a study's instances as {series, sop} pairs. */
export async function listInstances(
  client: RawClient,
  study: string,
): Promise<{ series: string; sop: string }[]> {
  try {
    const d = await qidoJson(client, `/openmrs/pacs/dicom-web/studies/${study}/instances`);
    if (!Array.isArray(d)) return [];
    return d
      .map((i: any) => ({
        series: i["0020000E"]?.Value?.[0],
        sop: i["00080018"]?.Value?.[0],
      }))
      .filter((x) => x.series && x.sop);
  } catch {
    return [];
  }
}

/** Sign one image ref into stable (cacheable) portal-proxy URLs. */
export function signImage(ref: ImageRef): ImagingImage {
  const mk = (size: "full" | "thumb") =>
    `/api/pacs/render?d=${encodeURIComponent(
      jwt.sign({ ...ref, size }, JWT_SECRET, { noTimestamp: true }),
    )}`;
  return { url: mk("full"), thumbUrl: mk("thumb") };
}

/** Verify+decode a signed image ref from the proxy route. Throws if tampered. */
export function verifyImageToken(token: string): ImageRef & { size: "full" | "thumb" } {
  return jwt.verify(token, JWT_SECRET) as ImageRef & { size: "full" | "thumb" };
}

/**
 * Build the WADO-URI PATH (relative to the OpenMRS host) for a rendered picture.
 * Callers fetch it through the existing OpenMRS client so credentials stay in one
 * place (server/lib/clients.ts), never duplicated.
 */
export function wadoPath(ref: ImageRef, size: "full" | "thumb"): string {
  const base = `/openmrs/pacs/wado?requestType=WADO&studyUID=${ref.study}&seriesUID=${ref.series}&objectUID=${ref.sop}&contentType=image/jpeg`;
  // Thumbnails: ask PACS for a smaller raster so list views stay light.
  return size === "thumb" ? `${base}&rows=480&columns=480` : base;
}
