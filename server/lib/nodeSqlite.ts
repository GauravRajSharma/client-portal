/**
 * `node:sqlite` access for Expo API routes.
 *
 * Metro can't resolve the newer `node:sqlite` builtin when bundling API routes (it isn't
 * in Metro's known-builtins list), and `better-sqlite3` is a native addon Metro can't
 * bundle at all. So require `node:sqlite` indirectly at runtime — Metro won't statically
 * analyze an eval'd require, and Node 24 (the server runtime) resolves the builtin fine.
 */
// `process.getBuiltinModule` (Node 22.3+) returns a core module without going through
// require/import, so Metro never sees it — the only reliable way to reach `node:sqlite`
// from a Metro-bundled API route. Node 24 is the server runtime.
const proc = (globalThis as any).process;
const sqlite =
  typeof proc?.getBuiltinModule === "function"
    ? proc.getBuiltinModule("node:sqlite")
    : // biome-ignore lint/security/noGlobalEval: last-resort builtin access
      (eval("require") as (m: string) => any)("node:sqlite");

export const DatabaseSync: any = sqlite.DatabaseSync;
