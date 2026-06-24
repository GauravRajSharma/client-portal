/**
 * Better Auth — the thin accounts layer. An app account (email + password) that owns
 * links to hospital records. The SQLite DB (node:sqlite, a Node built-in so it bundles
 * in Expo API routes — better-sqlite3 can't) stores ONLY app users, sessions, and the
 * `hospital_link` rows. No clinical data ever lands here.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "./lib/nodeSqlite";
import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import {
  AUTH_DB_PATH,
  BETTER_AUTH_SECRET,
  PASSKEY_ORIGIN,
  PASSKEY_RP_ID,
} from "./config/env";

mkdirSync(dirname(AUTH_DB_PATH), { recursive: true });

export const authDb = new DatabaseSync(AUTH_DB_PATH);

/** Our own table linking an app user to a verified hospital record (no clinical data). */
authDb.exec(`
  CREATE TABLE IF NOT EXISTS hospital_link (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    server TEXT NOT NULL,
    uuid TEXT NOT NULL,
    name TEXT,
    ref TEXT,
    createdAt INTEGER NOT NULL,
    UNIQUE(userId, server, uuid)
  );
`);

export const auth = betterAuth({
  database: authDb,
  secret: BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8081",
  emailAndPassword: { enabled: true },
  plugins: [
    expo(),
    // WebAuthn passkeys — phishing-resistant login on web (uses the platform's own
    // Face ID / fingerprint / PIN). Native uses the biometric app-lock instead.
    passkey({ rpID: PASSKEY_RP_ID, rpName: "Patient Portal", origin: PASSKEY_ORIGIN }),
  ],
  // Native deep-link scheme + Expo dev + the web origin(s) that may post here.
  trustedOrigins: ["ehrplus://", "exp://", "exp://*", "http://localhost:8081"],
});

export type AppUser = typeof auth.$Infer.Session.user;
