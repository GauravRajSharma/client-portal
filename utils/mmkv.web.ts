/**
 * Web build of the persister module: NO persistence. Clinical data is never written to
 * the browser — every visit fetches fresh. Metro resolves this file on web, so the
 * SQLite engine (expo-sqlite, in utils/mmkv.ts) is never bundled for web.
 */
import type { Persister } from "@tanstack/react-query-persist-client";

export const webNoPersist = true;
export const persister: Persister | undefined = undefined;
