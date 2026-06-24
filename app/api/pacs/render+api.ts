/**
 * Read-only PACS image proxy. The device asks for a signed image ref (see
 * server/lib/pacs.ts `signImage`); we verify the signature, then fetch the rendered
 * picture from the hospital PACS (WADO-URI) through the existing OpenMRS client and
 * stream it back. The device never talks to PACS directly, and only signed refs —
 * minted only for the authenticated patient's own studies — resolve to an image.
 */
import { createClients } from "../../../server/lib/clients";
import { verifyImageToken, wadoPath } from "../../../server/lib/pacs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("d");
  if (!token) return new Response("missing image ref", { status: 400 });

  let ref: ReturnType<typeof verifyImageToken>;
  try {
    ref = verifyImageToken(token);
  } catch {
    return new Response("invalid image ref", { status: 403 });
  }

  // Reuse the OpenMRS client for this hospital so PACS credentials live in one place.
  const clients = createClients({ BASE_URL: `http://${ref.server}.netbird.selfhosted` });
  const size = ref.size === "thumb" ? "thumb" : "full";

  try {
    const upstream = await clients.OpenmrsRAWAPI.raw(wadoPath(ref, size), {
      responseType: "arrayBuffer",
      headers: { Accept: "image/jpeg" },
    });
    return new Response(upstream._data, {
      headers: {
        "content-type": upstream.headers?.get?.("content-type") ?? "image/jpeg",
        // Stable signed URL -> safe to cache hard on device.
        "cache-control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("image unavailable", { status: 502 });
  }
}
