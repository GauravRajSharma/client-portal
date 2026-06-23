/**
 * Server-side secrets/config. Read from the environment so nothing security-
 * sensitive is hardcoded. Set JWT_SECRET in the deployment env (.env / container).
 */

// In dev (expo start) a missing secret would silently break auth, so fall back to a
// clearly-marked dev value but never to a "real-looking" one. Production MUST set it.
const DEV_FALLBACK = "dev-only-insecure-change-me";

export const JWT_SECRET: string =
  process.env.JWT_SECRET ?? process.env.EXPO_PUBLIC_JWT_SECRET ?? DEV_FALLBACK;

if (process.env.NODE_ENV === "production" && JWT_SECRET === DEV_FALLBACK) {
  // Fail loud in prod rather than sign tokens with a known key.
  throw new Error("JWT_SECRET must be set in production");
}

// ponytail: backend basic-auth creds are still inline in server/lib/clients.ts
// (pre-existing). Move them here behind env vars when rotating credentials.
