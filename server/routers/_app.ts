import { z } from "zod";
import { procedure, router } from "../trpc";
import { createERPClient } from "../lib/clients";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import * as Crypto from "expo-crypto";

// "msmh", "icdhup", "kahs", "gulmi", "bajh"
const hospitals = [
  { prefix: "MSMH", server: "msmh" },
  { prefix: "KAHS", server: "kahs" },
  { prefix: "ICDH", server: "icdhup" },
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

      if (server === "") {
        const prefix = mrn.slice(0, 4).toUpperCase();
        console.log({ prefix });
        server = hospitals.find((h) => h.prefix === prefix)?.server ?? "";
      }

      console.log({ server, mrn });

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
          {
            uuid: string;
            id: string;
            name: string;
            ref: string;
            nhis_number: string | false;
            mobile: string | false;
          }[]
        >({
          model: "res.partner",
          method: "search_read",
          args: [[["ref", "=", mrn]]],
          kwargs: {
            fields: ["uuid", "id", "name", "nhis_number", "mobile", "ref"],
            limit: 1,
          },
        });

        let p = patients?.[0];

        if (!p) throw new Error("patient not found");
        const { uuid, name, ref } = p;
        const verification = await findTwofaforPatient(p);

        const cookie = jwt.sign(
          { uuid, name, ref, server, verification },
          "super-secret-key",
        );

        const response = { name, ref, verification, cookie };

        console.log({ response });

        return response;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          message: `${error}`,
          code: "BAD_REQUEST",
        });
      }
    }),
});

async function findTwofaforPatient({
  nhis_number,
  mobile,
}: {
  uuid: string;
  id: string;
  name: string;
  ref: string;
  nhis_number: string | false;
  mobile: string | false;
}) {
  if (nhis_number !== "" && nhis_number) {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nhis_number,
    );
    return {
      hidden: digest,
      field: { label: "Insurance Number", value: "nhis_number" },
    };
  }

  if (mobile !== "" && mobile) {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      mobile,
    );
    return {
      hidden: digest,
      field: { label: "Mobile Number", value: "mobile" },
    };
  }
}

// export type definition of API
export type AppRouter = typeof appRouter;
