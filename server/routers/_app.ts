import { z } from "zod";
import { procedure, router } from "../trpc";
import { createClients, createERPClient } from "../lib/clients";
import { initTRPC, TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import * as Crypto from "expo-crypto";
import { TActiveMedicationOrder } from "../types/initial";
import { toVisit } from "../adapters";
import type { PatientDocument } from "../dto";
import { toMedication } from "../adapters";
import type { Medication, Prescription } from "../dto";
import { toVisit, toVisitDetail } from "../adapters";
import type { Visit, VisitDetail } from "../dto";
import { toLabResult } from "../adapters";
import type { LabResult } from "../dto";
import { toBill } from "../adapters";
import type { Bill } from "../dto";
import { toLabResult, toMedication, toVisit } from "../adapters";
import type { LabResult, PatientOverview } from "../dto";
import { toPatient } from "../adapters";
import type { Patient } from "../dto";

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
    { prefix: "GPKH", server: "gpkm" },
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

import { JWT_SECRET } from "../config/env";

// Secret now comes from the environment (server/config/env.ts), not source.
const JWT_VERIFICATION_KEY = JWT_SECRET;
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
                const result = jwt.verify(
                    opts.input.token,
                    JWT_VERIFICATION_KEY,
                    {
                        complete: true,
                    },
                );

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
                server =
                    hospitals.find((h) => h.prefix === prefix)?.server ?? "";
            }

            const hospital = hospitals.find((h) => h.server === server);

            if (!hospital)
                throw new TRPCError({
                    message: `hospital not found ${server}`,
                    code: "BAD_REQUEST",
                });

            if (
                !mrn
                    .toLowerCase()
                    .startsWith(hospital?.prefix?.toLowerCase() ?? "")
            )
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
                        fields: [
                            "uuid",
                            "id",
                            "name",
                            "nhis_number",
                            "mobile",
                            "ref",
                        ],
                        limit: 1,
                    },
                });

                let p = patients?.[0];

                if (!p) throw new Error("patient not found");

                const { uuid, name, ref } = p;
                const verification = await findTwofaforPatient(p);

                if (!verification)
                    throw new Error(
                        "verification metric not found for patient. denied.",
                    );

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

    patient: protectedProcedure.query(async ({ ctx }): Promise<Patient> => {
        // Identity is derived from the verified token (ctx.auth.uuid), never the URL.
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

        // The patient's facility name lives on the ERP, not res.partner. Fetch it
        // tolerantly: a failure here must never break the profile (graceful degrade
        // to just the server code). This is a read-only GET.
        let hospitalName: string | undefined;
        try {
            const hospital = await ctx.clients.OdooAPI<{ name: string }>(
                "api/hospital",
            );
            hospitalName = hospital?.name;
        } catch {
            hospitalName = undefined;
        }

        // Always return a stable DTO; the UI speaks Patient, never raw partner rows.
        return toPatient(patients?.[0] ?? {}, hospitalName, ctx.auth.server);
    }),
    patientActiveMedications: protectedProcedure.query(
        async ({ ctx }): Promise<Medication[]> => {
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

            // Speak DTOs, not raw OpenMRS shapes. Mapping lives in adapters.
            return (response.results ?? []).map(toMedication);
        },
    ),

    patientPrescription: protectedProcedure
        .input(z.object({ visit: z.string() }))
        .query(async ({ ctx, input }): Promise<Prescription> => {
            const html = await ctx.clients.BridgeApi<string>(
                `/summary/${ctx.auth.uuid}/${input.visit}?mode=visit&format=html`,
            );
            const cleanedHtml = html.replace(/<img\b[^>]*>/gi, "");

            return { visitId: input.visit, html: cleanedHtml };
        }),

    /**
     * Lab results for a single visit, returned as DTOs (LabResult[]).
     * The UI never sees raw Odoo/OpenMRS shapes - adapters own that mapping.
     */
    patientLabResults: protectedProcedure
        .input(z.object({ visit: z.string() }))
        .query(async ({ ctx, input }): Promise<LabResult[]> => {
            return fetchLabResults(ctx, { visit: input.visit });
        }),

    /**
     * patientDocuments: read-only catalogue of patient-facing PDFs/HTML the patient
     * can open. For each of the patient's visits we expose a "Visit summary" (PDF,
     * receiver=patient) and a stitched "Report" (PDF).
     *
     * Security: the patient uuid is taken ONLY from the verified token (ctx.auth.uuid),
     * never from client input. The [uuid] in the URL is cosmetic (see DESIGN.md).
     *
     * We return absolute URLs the app opens directly. The Bridge endpoints are open on
     * the internal network (no auth header needed), so no byte proxying is required.
     */
    patientDocuments: protectedProcedure.query(async ({ ctx }) => {
        // Bridge base for this hospital, mirroring createClients() (server:34567).
        const bridgeBase = `http://${ctx.auth.server}.netbird.selfhosted:34567`;
        const patientUuid = ctx.auth.uuid;

        const visits = await ctx.clients.OdooAPI.rpc<
            {
                external_uuid: string;
                id: string;
                display_name: string;
                department: string;
                manual_close_visit: boolean;
                visit_type: string;
            }[]
        >({
            model: "patient.visit",
            method: "search_read",
            args: [[["partner_id.uuid", "=", patientUuid]]],
     * patientOverview — read-only aggregate for the Home screen. Reuses the same
     * backend reads as the per-feature queries (visits, lab observations, active
     * medications) and maps everything through the adapters into a single DTO so the
     * UI makes one call. No mutation; identity is from the token (ctx.auth.uuid).
     */
    patientOverview: protectedProcedure.query(async ({ ctx }): Promise<PatientOverview> => {
        const ATTENTION_CAP = 4;
        const MED_SAMPLE = 3;

        // 1) Latest visit (same model/order as patientVisits; we only need the newest).
        const latestVisitPromise = ctx.clients.OdooAPI.rpc<any[]>({
            model: "patient.visit",
            method: "search_read",
            args: [[["partner_id.uuid", "=", ctx.auth.uuid]]],
            kwargs: {
                fields: [
                    "external_uuid",
                    "id",
                    "display_name",
                    "department",
                    "create_date",
                    "manual_close_visit",
                    "visit_type",
                ],
                order: "create_date desc",
            },
        });

        // Flat catalogue of PatientDocument (the DTO the UI speaks).
        const documents: PatientDocument[] = [];
        // Grouped-by-visit view so the UI can render date/visit headers without
        // re-deriving visit metadata. Each group's `documents` are pure DTOs.
        const groups: {
            visitId: string;
            title: string;
            date?: string;
            typeLabel: string;
            documents: PatientDocument[];
        }[] = [];

        for (const visit of visits) {
            const v = toVisit(visit);
            if (!v.id) continue;

            const summary: PatientDocument = {
                id: `summary-${v.id}`,
                title: "Visit summary",
                kind: "summary",
                format: "pdf",
                url: `${bridgeBase}/summary/${patientUuid}/${v.id}?format=pdf&receiver=patient`,
            };
            const report: PatientDocument = {
                id: `report-${v.id}`,
                title: "Report",
                kind: "report",
                format: "pdf",
                url: `${bridgeBase}/reports/${v.id}`,
            };

            documents.push(summary, report);
            groups.push({
                visitId: v.id,
                title: v.typeLabel,
                date: v.date,
                typeLabel: v.typeLabel,
                documents: [summary, report],
            });
        }

        return { documents, groups };
    }),
     * Global lab results across ALL of the patient's visits, as DTOs (LabResult[]).
     * Same emr.lab_observations source as patientLabResults, without the visit filter.
     * Identity is taken from the verified token (ctx.auth.uuid) only. Read-only.
     */
    patientAllLabResults: protectedProcedure.query(
        async ({ ctx }): Promise<LabResult[]> => {
            return fetchLabResults(ctx, {});
        },
    ),
                    "diagnosis_by",
                    "department",
                    "payment_type",
                    "payment_method",
                    "manual_close_visit",
                    "visit_type",
                    "create_date",
                ],
                order: "create_date desc",
                limit: 1,
            },
        });

        // 2) Lab observations across the whole record (same model as patientLabResults,
        //    minus the per-visit filter) so we can surface anything out of range.
        const labRawPromise = ctx.clients.OdooAPI.rpc<any[]>({
            model: "emr.lab_observations",
            method: "search_read",
            args: [[["patient.uuid", "=", ctx.auth.uuid]]],
            kwargs: {
                fields: ["lab_item", "id", "value", "raw", "create_date"],
                order: "create_date desc",
            },
        });

        // 3) Active medications (same call as patientActiveMedications).
        const medsPromise = ctx.clients.OpenmrsAPI<{
            results: Array<TActiveMedicationOrder>;
        }>("order", {
            query: {
                patient: ctx.auth.uuid,
                careSetting: "6f0c9a92-6f24-11e3-af88-005056821db0",
                orderType: "131168f4-15f5-102d-96e4-000c29c2a5d7",
                v: `custom:(${customFields.medications})`,
            },
        });

        const [latestVisitRaw, labRaw, medsRes] = await Promise.all([
            latestVisitPromise,
            labRawPromise,
            medsPromise,
        ]);

        // Latest visit -> DTO (resolve its doctor only).
        let latestVisit: PatientOverview["latestVisit"];
        const vRaw = latestVisitRaw?.[0];
        if (vRaw) {
            const doctor = await ctx.clients.OdooAPI.rpc<any[]>({
                model: "emr.practitioner",
                method: "search_read",
                args: [[["id", "=", vRaw.diagnosis_by?.[0]]]],
                kwargs: {
                    fields: ["name", "id", "license_number", "specialized_title"],
                    limit: 1,
                },
            });
            latestVisit = toVisit(vRaw, doctor?.[0]);
        }

        // Labs -> DTOs. Only look up concept meta for results that have a lab_item.
        const labItems = (labRaw ?? []).filter((r) => r.lab_item);
        const labResults: LabResult[] = await Promise.all(
            labItems.map(async (r) => {
                let meta: any = {};
                try {
                    meta = await ctx.clients.OpenmrsAPI<any>(
                        `concept/${r.raw?.concept?.uuid}?v=full`,
                    );
                } catch {
                    meta = {};
                }
                return toLabResult(r, meta);
            }),
        );
        const attention = labResults.filter(
            (r) => r.status !== "normal" && r.status !== "unknown",
        );

        // Active medications -> count + a few recognisable names.
        const meds = (medsRes.results ?? [])
            .map((m) => toMedication(m))
            .filter((m) => m.active);

        return {
            latestVisit,
            labs: {
                attention: attention.slice(0, ATTENTION_CAP),
                attentionCount: attention.length,
                total: labResults.length,
            },
            medications: {
                activeCount: meds.length,
                sampleNames: meds.slice(0, MED_SAMPLE).map((m) => m.name),
            },
        };
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
     * Returns app-owned Visit[] DTOs (see server/dto). The UI never sees raw Odoo
     * fields; mapping lives in toVisit/toPractitioner. Newest visit first.
     */
    patientVisits: protectedProcedure.query(async ({ ctx }): Promise<Visit[]> => {
        const visits = await fetchRawVisits(ctx);

        return Promise.all(
            visits.map(async (visit) => {
                const doctor = await fetchVisitDoctor(ctx, visit.diagnosis_by?.[0]);
                return toVisit(visit, doctor);
            }),
        );
    }),

    /**
     * A single visit as a VisitDetail DTO (adds diagnoses on top of Visit). Identity
     * is the token's uuid; the visit's external_uuid scopes the lookup. Read-only.
     */
    patientVisit: protectedProcedure
        .input(z.object({ visit: z.string() }))
        .query(async ({ ctx, input }): Promise<VisitDetail | null> => {
            const visits = await fetchRawVisits(ctx, input.visit);
            const raw = visits?.[0];
            if (!raw) return null;
            const doctor = await fetchVisitDoctor(ctx, raw.diagnosis_by?.[0]);
            return toVisitDetail(raw, doctor);
        }),
     * patientBills — read-only billing & insurance view.
     *
     * Identity is taken from the verified token (ctx.auth.uuid); the URL is never
     * trusted. Returns one Bill per Odoo customer invoice (account.move) for this
     * patient, each with itemized lines (account.move.line) and an insurance
     * coverage block when there is any insurance signal (a claim code on the
     * invoice, or the patient carries an NHIS number).
     *
     * This is a pure projection of what the patient owes / was covered. It calls
     * ONLY read endpoints (search_read) and never posts, pays, or mutates.
     */
    patientBills: protectedProcedure.query(async ({ ctx }): Promise<Bill[]> => {
        // The patient's NHIS / insurance number, for the coverage block. Best
        // effort; tolerate it being absent.
        let nhisNumber: string | undefined;
        try {
            const partners = await ctx.clients.OdooAPI.rpc<
                { nhis_number: string | false }[]
            >({
                model: "res.partner",
                method: "search_read",
                args: [[["uuid", "=", ctx.auth.uuid]]],
                kwargs: { fields: ["nhis_number"], limit: 1 },
            });
            const raw = partners?.[0]?.nhis_number;
            nhisNumber = raw && raw !== "" ? String(raw) : undefined;
        } catch {
            nhisNumber = undefined;
        }

        // Customer invoices for this patient, newest first. Positive amounts.
        const invoices = await ctx.clients.OdooAPI.rpc<
            {
                id: number;
                name: string | false;
                invoice_date: string | false;
                date: string | false;
                amount_total: number;
                amount_residual: number;
                payment_state: string | false;
                state: string | false;
                claim_code: string | false;
                care_type: string | false;
                currency_id: [number, string] | false;
            }[]
        >({
            model: "account.move",
            method: "search_read",
            args: [
                [
                    ["partner_id.uuid", "=", ctx.auth.uuid],
                    ["move_type", "=", "out_invoice"],
                    ["state", "!=", "cancel"],
                ],
            ],
            kwargs: {
                fields: [
                    "id",
                    "name",
                    "invoice_date",
                    "date",
                    "amount_total",
                    "amount_residual",
                    "payment_state",
                    "state",
                    "claim_code",
                    "care_type",
                    "currency_id",
                ],
                order: "invoice_date desc, id desc",
            },
        });

        if (!Array.isArray(invoices) || invoices.length === 0) return [];

        // Itemized lines per invoice. Skip note/section/subtotal rows
        // (display_type set) so the patient sees real charges only.
        return Promise.all(
            invoices.map(async (inv) => {
                let lines: any[] = [];
                try {
                    lines = await ctx.clients.OdooAPI.rpc<any[]>({
                        model: "account.move.line",
                        method: "search_read",
                        args: [
                            [
                                ["move_id", "=", inv.id],
                                ["display_type", "=", false],
                                ["exclude_from_invoice_tab", "=", false],
                            ],
                        ],
                        kwargs: {
                            fields: [
                                "name",
                                "quantity",
                                "price_unit",
                                "price_subtotal",
                                "price_total",
                                "product_id",
                            ],
                            order: "sequence asc, id asc",
                        },
                    });
                } catch {
                    lines = [];
                }
                return toBill(inv, lines, { nhisNumber });
            }),
        );
    }),
});

type RawVisit = {
    external_uuid: string;
    id: string;
    display_name: string;
    department: string;
    manual_close_visit: boolean;
    visit_type: string;
    diagnosis_by: number[];
    diagnoses?: unknown;
};

/** All of the patient's visits, or just one when `externalUuid` is given. */
async function fetchRawVisits(
    ctx: { clients: ReturnType<typeof createClients>; auth: TAuthData },
    externalUuid?: string,
): Promise<RawVisit[]> {
    const domain: any[] = [["partner_id.uuid", "=", ctx.auth.uuid]];
    if (externalUuid) domain.push(["external_uuid", "=", externalUuid]);

    return ctx.clients.OdooAPI.rpc<RawVisit[]>({
        model: "patient.visit",
        method: "search_read",
        args: [domain],
        kwargs: {
            fields: [
                "external_uuid",
                "id",
                "display_name",
                "diagnosis_by",
                "diagnoses",
                "department",
                "payment_type",
                "payment_method",
                "manual_close_visit",
                "visit_type",
            ],
            order: "create_date desc",
            ...(externalUuid ? { limit: 1 } : {}),
        },
    });
}

/** Resolve the diagnosing practitioner for a visit, if any. */
async function fetchVisitDoctor(
    ctx: { clients: ReturnType<typeof createClients> },
    practitionerId?: number,
) {
    if (!practitionerId) return undefined;
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
        args: [[["id", "=", practitionerId]]],
        kwargs: {
            fields: ["name", "id", "license_number", "specialized_title"],
            limit: 1,
        },
    });
    return doctor?.[0];
type LabCtx = {
    auth: TAuthData;
    clients: ReturnType<typeof createClients>;
};

type RawLabObservation = {
    id: number;
    lab_item: [number, string] | false;
    value: string;
    create_date?: string;
    raw: {
        order: { uuid: string };
        value: string;
        status: string;
        concept: { uuid: string };
    };
};

type ConceptMeta = {
    hiAbsolute: number;
    hiCritical: number;
    hiNormal: number;
    lowAbsolute: number;
    lowCritical: number;
    lowNormal: number;
    units: string;
};

/**
 * Shared lab-observation fetch + DTO mapping for both the per-visit and the global
 * (all-visits) lab queries. Pulls observations from Odoo (emr.lab_observations),
 * enriches each with its OpenMRS concept reference range, and returns LabResult[].
 *
 * Concept metadata is fetched once per distinct concept (deduped) so the global query
 * across many visits does not refetch the same reference ranges repeatedly.
 */
async function fetchLabResults(
    ctx: LabCtx,
    opts: { visit?: string },
): Promise<LabResult[]> {
    const domain: any[] = [["patient.uuid", "=", ctx.auth.uuid]];
    if (opts.visit) {
        domain.push(["patient_visit.external_uuid", "=", opts.visit]);
    }

    const observations = await ctx.clients.OdooAPI.rpc<RawLabObservation[]>({
        model: "emr.lab_observations",
        method: "search_read",
        args: [domain],
        kwargs: {
            fields: ["lab_item", "id", "value", "raw", "create_date"],
            order: "create_date asc",
        },
    });

    const final = observations.filter((r) => r.lab_item);

    // Dedupe concept lookups: one OpenMRS call per distinct concept uuid.
    const conceptCache = new Map<string, Promise<ConceptMeta | undefined>>();
    const loadConcept = (uuid?: string) => {
        if (!uuid) return Promise.resolve(undefined);
        let cached = conceptCache.get(uuid);
        if (!cached) {
            cached = ctx.clients
                .OpenmrsAPI<ConceptMeta>(`concept/${uuid}?v=full`)
                .catch(() => undefined);
            conceptCache.set(uuid, cached);
        }
        return cached;
    };

    return Promise.all(
        final.map(async (obs) => {
            const meta = await loadConcept(obs.raw?.concept?.uuid);
            return toLabResult(obs, meta);
        }),
    );
}

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
