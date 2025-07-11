import { z } from "zod";
import { procedure, router } from "../trpc";
import { createClients, createERPClient } from "../lib/clients";
import { initTRPC, TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import * as Crypto from "expo-crypto";
import { TActiveMedicationOrder } from "../types/initial";

function v(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || "");
  }, "");

  return result.replace(/\s+/g, "");
}

const customFields = {
  encounters: v`encounters:(
    uuid,
    encounterProviders:(provider),
    diagnoses:(display,certainty),
    obs:(
      dateCreated,
      concept:(uuid,display),
      display,
      uuid,
      groupMembers:(display,uuid,concept:(uuid)),
      encounter:(form:(uuid))
    )
  )`,
  medications: v`
    uuid,orderNumber,accessionNumber,
    patient:ref,action,careSetting:ref,
    previousOrder:ref,dateActivated,
    scheduledDate,dateStopped,autoExpireDate,
    orderType:ref,encounter:ref,
    orderer:(uuid,display,person:(display)),
    orderReason,orderReasonNonCoded,
    orderType,urgency,instructions,
    commentToFulfiller,
    drug:(
      uuid,display,strength,
      dosageForm:(display,uuid),
      concept:(display,uuid,names:(name))
    ),
    dose,doseUnits:ref,
    frequency:ref,asNeeded,asNeededCondition,
    quantity,quantityUnits:ref,numRefills,
    dosingInstructions,duration,durationUnits:ref,
    route:ref,brandName,dispenseAsWritten
  `,
};

const hospitals = [
  { prefix: "GLDH", server: "gulmi" },
  { prefix: "MSMH", server: "msmh" },
  { prefix: "BJDH", server: "bajh" },
  { prefix: "ICDH", server: "icdhup" },
  { prefix: "OKDH", server: "okdh" },
  { prefix: "KAHS", server: "kahs" },
  { prefix: "SOLU", server: "solu" },
  { prefix: "MBDH", server: "mbdh-cloud" },
  { prefix: "ABHU", server: "abhu" },
  { prefix: "RUPA", server: "rupa" },
];

const JWT_VERIFICATION_KEY = "super secret token put this in env";
// --

type TAuthData = {
  uuid: string;
  name: string;
  ref: string;
  server: string;
};

const t = initTRPC
  .context<{
    token?: string;
    auth?: TAuthData | null;
    clients?: ReturnType<typeof createClients>;
  }>()
  .create();

export const publicProcedure = t.procedure;

const protectedProcedure = t.procedure.use(async (opts) => {
  try {
    const result = jwt.verify(opts.ctx.token ?? "-", JWT_VERIFICATION_KEY, {
      complete: true,
    });

    if (typeof result.payload !== "object")
      throw new Error("not a valid auth token");

    const auth = result.payload as TAuthData;

    const clients = createClients({
      BASE_URL: `http://${auth.server}.netbird.selfhosted`,
    });

    return opts.next({
      ctx: {
        auth: result.payload as TAuthData,
        clients,
      },
    });
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED", cause: error });
  }
});

type THospital = {
  name: string;
  hospital: {
    prefix: string;
    server: string;
  };
};

export const appRouter = router({
  hospitals: publicProcedure.query(async () => {
    const results = await Promise.all(
      hospitals.map(async (hospital) => {
        const client = createERPClient({
          BASE_URL: `http://${hospital.server}.netbird.selfhosted`,
        });

        try {
          const { name } = await client<THospital>("api/hospital");
          return { name, hospital };
        } catch (error) {
          console.log("error", error);
          return;
        }
      }),
    );

    return results.filter((h) => typeof h !== "undefined") as THospital[];
  }),

  verify: publicProcedure
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

  signIn: publicProcedure
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

  patient: protectedProcedure.query(async ({ ctx }) => {
    const patients = await ctx.clients.OdooAPI.rpc<
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
      args: [[["uuid", "=", ctx.auth.uuid]]],
      kwargs: {
        fields: ["uuid", "id", "name", "nhis_number", "mobile", "ref"],
        limit: 1,
      },
    });

    return patients?.[0];
  }),
  patientActiveMedications: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.clients.OpenmrsAPI<{
      results: Array<TActiveMedicationOrder>;
    }>("order", {
      query: {
        patient: ctx.auth.uuid,
        careSetting: "6f0c9a92-6f24-11e3-af88-005056821db0",
        // status: "ACTIVE",
        orderType: "131168f4-15f5-102d-96e4-000c29c2a5d7",
        v: `custom:(${customFields.medications})`,
      },
    });

    return response.results;
  }),

  patientPrescription: protectedProcedure
    .input(z.object({ visit: z.string() }))
    .query(async ({ ctx, input }) => {
      const html = await ctx.clients.BridgeApi<string>(
        `/summary/${ctx.auth.uuid}/${input.visit}?mode=visit&format=html`,
      );
      const cleanedHtml = html.replace(/<img\b[^>]*>/gi, "");

      return cleanedHtml;
    }),

  patientLabResults: protectedProcedure
    .input(z.object({ visit: z.string() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.clients.OdooAPI.rpc<
        {
          id: number;
          lab_item: [number, string] | false;
          value: string;
          raw: {
            order: { uuid: string };
            value: string;
            status: string;
            concept: { uuid: string };
          };
        }[]
      >({
        model: "emr.lab_observations",
        method: "search_read",
        args: [
          [
            ["patient.uuid", "=", ctx.auth.uuid],
            ["patient_visit.external_uuid", "=", input.visit],
          ],
        ],
        kwargs: {
          fields: ["lab_item", "id", "value", "raw"],
          order: "create_date asc",
        },
      });
      let final = results.filter((r) => r.lab_item);

      return Promise.all(
        final.map(async (result) => {
          const meta = await ctx.clients.OpenmrsAPI<{
            hiAbsolute: number;
            hiCritical: number;
            hiNormal: number;
            lowAbsolute: number;
            lowCritical: number;
            lowNormal: number;
            units: string;
          }>(`concept/${result.raw.concept.uuid}?v=full`);
          return { ...result, meta };
        }),
      );
    }),

  patientVisits: protectedProcedure.query(async ({ ctx }) => {
    const visits = await ctx.clients.OdooAPI.rpc<
      {
        external_uuid: string;
        id: string;
        display_name: string;
        department: string;
        manual_close_visit: boolean;
        visit_type: string;
        diagnosis_by: number[];
      }[]
    >({
      model: "patient.visit",
      method: "search_read",
      args: [[["partner_id.uuid", "=", ctx.auth.uuid]]],
      kwargs: {
        fields: [
          "external_uuid",
          "id",
          "display_name",
          "diagnosis_by",
          "department",
          "payment_type",
          "payment_method",
          "manual_close_visit",
          "visit_type",
        ],
        order: "create_date desc",
      },
    });

    return Promise.all(
      visits.map(async (visit) => {
        const doctor = await ctx.clients.OdooAPI.rpc<
          {
            name: string;
            id: number;
            license_number: string;
            specialized_title: string;
          }[]
        >({
          model: "emr.practitioner",
          method: "search_read",
          args: [[["id", "=", visit.diagnosis_by?.[0]]]],
          kwargs: {
            fields: ["name", "id", "license_number", "specialized_title"],
            limit: 1,
          },
        });
        return { ...visit, doctor: doctor?.[0] };
      }),
    );
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
