/**
 * Tiny in-memory TTL cache for the public (pre-login) search endpoints. Within the TTL
 * window every caller of the same key gets the same cached result; after it, the next
 * caller refetches and re-caches. Revalidation-ish, server-side.
 *
 * ponytail: process-local Map — fine for the single on-prem server. If this ever runs
 * multi-instance/serverless, swap for a shared store (Redis) keyed the same way.
 */
type Entry = { at: number; data: unknown };
const store = new Map<string, Entry>();

export async function ttlCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.data as T;
  const data = await fn();
  store.set(key, { at: now, data });
  // Cheap cap so a flood of distinct queries can't grow the map unbounded.
  if (store.size > 500) {
    for (const k of store.keys()) {
      store.delete(k);
      if (store.size <= 400) break;
    }
  }
  return data;
}
