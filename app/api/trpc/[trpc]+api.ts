import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "../../../server/auth";
import { appRouter } from "../../../server/routers/_app";

async function createContext({ req }: { req: Request }) {
  // Resolve the Better Auth app-account session (if any) for appProcedures.
  let appUser: { id: string; email: string; name?: string } | null = null;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      appUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
    }
  } catch {
    appUser = null;
  }
  return {
    token: req.headers.get("Authorization"),
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon",
    appUser,
  };
}

export async function GET(req: Request) {
  return fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext });
}

export async function POST(req: Request) {
  return fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext });
}
