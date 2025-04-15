import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../server/routers/_app";

export async function GET(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req }) => {
      return { token: req.headers.get("Authorization") };
    },
  });
}

export async function POST(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,

    createContext: ({ req }) => {
      return { token: req.headers.get("Authorization") };
    },
  });
}
