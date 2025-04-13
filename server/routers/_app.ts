import { z } from "zod";
import { procedure, router } from "../trpc";
import { createERPClient } from "../lib/clients";

// "msmh", "icdhup", "kahs", "gulmi", "bajh"
const hospitals = [
  { prefix: "MSMH", server: "msmh" },
  { prefix: "KAHS", server: "kahs" },
  { prefix: "ICHD", server: "icdhup" },
  { prefix: "GLDH", server: "gulmi" },
  { prefix: "BAJH", server: "bajh" },
  { prefix: "SOLU", server: "solu" },
];

export const appRouter = router({
  hospitals: procedure.query(async (opts) => {
    console.log("OK");
    return await Promise.all(
      hospitals.map(async (hospital) => {
        const client = createERPClient({
          BASE_URL: `http://${hospital.server}.netbird.selfhosted`,
        });

        const { name } = await client<{ name: string; address: string }>(
          "api/hospital",
        );

        return { name, hospital };
      }),
    );
  }),

  signIn: procedure
    .input(
      z.object({
        mrn: z.string(),
        server: z.string(),
      }),
    )
    .mutation(async (opts) => {
      await new Promise((res) => setTimeout(res, 1000));

      return opts.input;
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
