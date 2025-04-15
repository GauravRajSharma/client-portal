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

const JWT_VERIFICATION_KEY = "super secret token put this in env";

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

  verify: procedure
    .input(
      z.object({
        token: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async (opts) => {
      try {
        const result = jwt.verify(opts.input.token, JWT_VERIFICATION_KEY, {
          complete: true,
        });

        if (!result.payload)
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "invalid verification request",
          });

        if (typeof result.payload !== "object")
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "invalid verification request",
          });
        const {
          uuid,
          name,
          ref,
          server,
          verification: { hidden },
        } = result.payload;

        opts.input.value;

        const digest = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          opts.input.value,
        );

        if (digest !== hidden)
          throw new TRPCError({
            code: "FORBIDDEN",
            cause: "invalid verification request",
          });

        return {
          uuid: uuid as string,
          accessToken: jwt.sign(
            {
              uuid,
              name,
              ref,
              server,
            },
            JWT_VERIFICATION_KEY,
          ),
        };
      } catch (error) {
        throw new TRPCError({
          code: "FORBIDDEN",
          cause: "invalid verification request",
        });
      }
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

        if (!verification)
          throw new Error("verification metric not found for patient. denied.");

        const cookie = jwt.sign(
          { uuid, name, ref, server, verification },
          JWT_VERIFICATION_KEY,
        );

        const response = { name, ref, verification, cookie };

        return response;
      } catch (error) {
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
