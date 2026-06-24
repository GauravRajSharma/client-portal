/**
 * Minimal per-IP fixed-window rate limiter for the public search endpoints. Throws a
 * tRPC TOO_MANY_REQUESTS once an IP exceeds `max` requests within `windowMs`.
 *
 * ponytail: process-local; fine for the single on-prem server. Move to a shared store
 * if ever run multi-instance.
 */
import { TRPCError } from "@trpc/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const id = `${key}:${ip}`;
  const b = buckets.get(id);
  if (!b || now > b.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (b.count >= max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many searches. Please wait a moment and try again.",
    });
  }
  b.count++;
}
