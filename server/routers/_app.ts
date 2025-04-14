import { z } from "zod";
import { procedure, router } from "../trpc";
import { createERPClient } from "../lib/clients";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

// "msmh", "icdhup", "kahs", "gulmi", "bajh"
const hospitals = [
  { prefix: "MSMH", server: "msmh" },
  { prefix: "KAHS", server: "kahs" },
  { prefix: "ICHD", server: "icdhup" },
  { prefix: "GLDH", server: "gulmi" },
  { prefix: "BJDH", server: "bajh" },
  { prefix: "SOLU", server: "solu" },
];

export const appRouter = router({
  hospitals: procedure.query(async (opts) => {
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
      let { mrn, server } = opts.input;
      const hospital = hospitals.find((h) => h.server === server);

      if (!hospital)
        throw new TRPCError({
          message: `hospital not found ${server}`,
          code: "BAD_REQUEST",
        });

      if (!mrn.toLowerCase().startsWith(hospital?.prefix?.toLowerCase() ?? ""))
        mrn = `${hospital.prefix}${mrn}`;

      const client = createERPClient({
        BASE_URL: `http://${hospital.server}.netbird.selfhosted`,
      });

      try {
        const patients = await client.rpc<
          { uuid: string; id: string; name: string }[]
        >({
          model: "res.partner",
          method: "search_read",
          args: [[["ref", "=", mrn]]],
          kwargs: {
            fields: ["uuid", "id", "name"],
            limit: 1,
          },
        });

        let p = patients?.[0];

        if (!p) throw new Error("patient not found");

        const cookie = jwt.sign(p, "super-secret-key");

        return { ...p, cookie };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          message: `${error}`,
          code: "BAD_REQUEST",
        });
      }
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
