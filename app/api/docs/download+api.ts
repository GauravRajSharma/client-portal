/**
 * Read-only document proxy. The device asks for a signed doc ref (see server/lib/docs.ts
 * `signDoc`); we verify it, fetch the PDF from the hospital's internal bridge through the
 * existing client, and stream it back. The device never sees the internal address, and
 * only signed refs — minted for the authenticated patient's own visits — resolve.
 */
import { createClients } from "../../../server/lib/clients";
import { verifyDocToken, docPath } from "../../../server/lib/docs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("d");
  if (!token) return new Response("missing doc ref", { status: 400 });

  let ref: ReturnType<typeof verifyDocToken>;
  try {
    ref = verifyDocToken(token);
  } catch {
    return new Response("invalid doc ref", { status: 403 });
  }

  // Reuse the per-hospital client so the internal bridge address lives in one place.
  const clients = createClients({ BASE_URL: `http://${ref.server}.netbird.selfhosted` });

  try {
    const upstream = await clients.BridgeApi.raw(docPath(ref), {
      responseType: "arrayBuffer",
      headers: { Accept: "application/pdf" },
    });
    return new Response(upstream._data, {
      headers: {
        "content-type": upstream.headers?.get?.("content-type") ?? "application/pdf",
        "content-disposition": `inline; filename="${ref.kind}-${ref.visit}.pdf"`,
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("document unavailable", { status: 502 });
  }
}
