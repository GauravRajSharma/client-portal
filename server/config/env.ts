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

// Better Auth (thin accounts layer). Its own signing secret + the on-disk SQLite
// path. The DB stores ONLY app users + their hospital links, never clinical data.
export const BETTER_AUTH_SECRET: string =
  process.env.BETTER_AUTH_SECRET ?? JWT_SECRET;

export const AUTH_DB_PATH: string =
  process.env.AUTH_DB_PATH ?? `${process.cwd()}/server/data/auth.db`;

// Passkey (WebAuthn) — the web biometric login path. rpID is the bare domain (no scheme
// or port); origin is the full page origin. Both MUST be the real domain in production.
export const PASSKEY_RP_ID: string = process.env.PASSKEY_RP_ID ?? "localhost";
export const PASSKEY_ORIGIN: string = process.env.PASSKEY_ORIGIN ?? "http://localhost:8081";

// ponytail: backend basic-auth creds are still inline in server/lib/clients.ts
// (pre-existing). Move them here behind env vars when rotating credentials.
