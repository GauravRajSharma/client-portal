/**
 * Native build of the persister module: persist the React Query cache to an on-device
 * SQLite DB (expo-sqlite) so history (older than a week) stays available offline. SQLite
 * avoids AsyncStorage's small size cap for large clinical caches.
 *
 * Web uses utils/mmkv.web.ts instead (no persistence — clinical data is never stored in
 * the browser). Caching policy (staleTime / maxAge) lives in app/_layout.tsx.
 */
import * as SQLite from "expo-sqlite";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

export const webNoPersist = false;

const db = SQLite.openDatabaseSync("rqcache.db");
db.execSync("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)");

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    const row = db.getFirstSync("SELECT v FROM kv WHERE k = ?", key) as { v: string } | null;
    return row?.v ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    db.runSync("INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)", key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    db.runSync("DELETE FROM kv WHERE k = ?", key);
  },
};

export const persister: Persister | undefined = createAsyncStoragePersister({ storage });
