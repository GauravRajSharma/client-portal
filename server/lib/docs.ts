/**
 * Document proxy helpers. Patient PDFs (visit summaries, reports) live on the hospital's
 * internal bridge (`*.netbird.selfhosted:34567`), which the device cannot reach and whose
 * address must never leak to the client. So, exactly like the PACS image proxy
 * (server/lib/pacs.ts), we hand the client only a signed, portal-relative URL; the portal
 * server verifies it, resolves the internal address, fetches the PDF, and streams it back.
 *
 * The token is signed (JWT, no expiry so it stays cacheable on-device) and is minted only
 * for the authenticated patient's own visits. A tampered or absent token resolves to nothing.
 */
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export type DocKind = "summary" | "report";

/** What the portal's document proxy needs to fetch one PDF. Internal-only fields. */
export interface DocRef {
  /** netbird host key for the hospital, e.g. "lamj" — never exposed to the client */
  server: string;
  /** patient uuid (summaries are addressed per patient) */
  uuid: string;
  kind: DocKind;
  /** visit external_uuid */
  visit: string;
}

/** Sign a doc ref into a stable, portal-relative proxy URL (no internal host leaked). */
export function signDoc(ref: DocRef): string {
  const token = jwt.sign(ref, JWT_SECRET, { noTimestamp: true });
  return `/api/docs/download?d=${encodeURIComponent(token)}`;
}

/** Verify+decode a signed doc ref from the proxy route. Throws if tampered. */
export function verifyDocToken(token: string): DocRef {
  return jwt.verify(token, JWT_SECRET) as DocRef;
}

/**
 * Build the bridge PATH (relative to `http://<server>.netbird.selfhosted:34567`) for a
 * document. Stays server-side; the client never sees it.
 */
export function docPath(ref: DocRef): string {
  return ref.kind === "summary"
    ? `/summary/${ref.uuid}/${ref.visit}?format=pdf&receiver=patient`
    : `/reports/${ref.visit}`;
}
