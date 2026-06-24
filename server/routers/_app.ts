import { z } from "zod";
import { procedure, router } from "../trpc";
import { createClients, createERPClient } from "../lib/clients";
import { initTRPC, TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import * as Crypto from "expo-crypto";
import { TActiveMedicationOrder } from "../types/initial";
import { toBill, toLabResult, toMedication, toPatient, toVisit, toVisitDetail } from "../adapters";
import {
    findStudyUid,
    isPacsModality,
    listInstances,
    modalityFromConcept,
    signImage,
} from "../lib/pacs";
import type {
    Bill,
    CareStatus,
    ImagingStudy,
    LabResult,
    Medication,
    Patient,
    PatientDocument,
    PatientOverview,
    Prescription,
    Visit,
    VisitDetail,
} from "../dto";

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
    { prefix: "DGPH", server: "dlph" },
    { prefix: "LAMJ", server: "lamj" },
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

        // Facility name lives on the ERP, not res.partner. Fetch tolerantly: a
        // failure here must never break the profile. Read-only GET.
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
     * The UI never sees raw Odoo/OpenMRS shapes; adapters own that mapping.
     */
    patientLabResults: protectedProcedure
        .input(z.object({ visit: z.string() }))
        .query(async ({ ctx, input }): Promise<LabResult[]> => {
            return fetchLabResults(ctx, { visit: input.visit });
        }),

    /**
     * Global lab results across ALL of the patient's visits, as DTOs (LabResult[]).
     * Same emr.lab_observations source as patientLabResults, without the visit filter.
     * Identity is taken from the verified token (ctx.auth.uuid) only. Read-only.
     */
    patientAllLabResults: protectedProcedure.query(
        async ({ ctx }): Promise<LabResult[]> => {
            return fetchLabResults(ctx, {});
        },
    ),

    /**
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

    /**
     * patientDocuments: read-only catalogue of patient-facing PDFs/HTML the patient
     * can open (a "Visit summary" PDF and a stitched "Report" PDF per visit).
     * Security: patient uuid comes ONLY from the verified token (ctx.auth.uuid).
     */
    patientDocuments: protectedProcedure.query(async ({ ctx }) => {
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

        const documents: PatientDocument[] = [];
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

    /**
     * patientOverview — read-only aggregate for the Home screen. One call returns the
     * latest visit, lab results needing attention, and active-medication summary, all
     * as DTOs. Identity is from the token (ctx.auth.uuid). No mutation.
     */
    patientOverview: protectedProcedure.query(
        async ({ ctx }): Promise<PatientOverview> => {
            const ATTENTION_CAP = 4;
            const MED_SAMPLE = 3;

            const latestVisitPromise = ctx.clients.OdooAPI.rpc<any[]>({
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
                        "create_date",
                    ],
                    order: "create_date desc",
                    limit: 1,
                },
            });

            const labRawPromise = ctx.clients.OdooAPI.rpc<any[]>({
                model: "emr.lab_observations",
                method: "search_read",
                args: [[["patient.uuid", "=", ctx.auth.uuid]]],
                kwargs: {
                    fields: ["lab_item", "id", "value", "raw", "create_date"],
                    order: "create_date desc",
                },
            });

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

            let latestVisit: PatientOverview["latestVisit"];
            const vRaw = latestVisitRaw?.[0];
            if (vRaw) {
                const doctor = await fetchVisitDoctor(ctx, vRaw.diagnosis_by?.[0]);
                latestVisit = toVisit(vRaw, doctor);
            }

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
        },
    ),

    /**
     * patientImaging — read-only radiology orders and their rendered images. For PACS
     * modalities (x-ray/CT/MRI/...) we resolve the DICOM study by accession and expose
     * its instances as portal-proxied, signed image URLs. Ultrasound and similar are
     * report-only (no DICOM). Identity is the token uuid. See server/lib/pacs.ts.
     */
    patientImaging: protectedProcedure.query(
        async ({ ctx }): Promise<ImagingStudy[]> => {
            const orderTypeIds = [
                "d3561dc0-5e07-11ef-8f7c-0242ac120002", // Radiology Order
                "b2b3613b-d654-11f0-ba57-b21ad4457a5e", // USG Order
            ];
            const lists = await Promise.all(
                orderTypeIds.map((ot) =>
                    ctx.clients
                        .OpenmrsAPI<{ results: any[] }>("order", {
                            query: {
                                patient: ctx.auth.uuid,
                                orderType: ot,
                                v: "custom:(uuid,orderNumber,accessionNumber,concept:(uuid,display),fulfillerStatus,dateActivated)",
                            },
                        })
                        .then((r) => r.results ?? [])
                        .catch(() => []),
                ),
            );

            const seen = new Set<string>();
            const orders: any[] = [];
            for (const list of lists) {
                for (const o of list) {
                    if (o?.uuid && !seen.has(o.uuid)) {
                        seen.add(o.uuid);
                        orders.push(o);
                    }
                }
            }
            orders.sort((a, b) =>
                String(b.dateActivated ?? "").localeCompare(String(a.dateActivated ?? "")),
            );

            return Promise.all(
                orders.map(async (o): Promise<ImagingStudy> => {
                    const name = o.concept?.display ?? "Imaging";
                    const modality = modalityFromConcept(name);
                    const accession = o.orderNumber ?? o.accessionNumber;
                    const base = {
                        orderId: String(o.uuid ?? ""),
                        orderNumber: String(accession ?? ""),
                        name,
                        modality,
                        date: o.dateActivated ?? undefined,
                        status: fulfillerLabel(o.fulfillerStatus),
                    };
                    if (!isPacsModality(modality) || !accession) {
                        return { ...base, hasImages: false, reportOnly: true, imageCount: 0, images: [] };
                    }
                    const study = await findStudyUid(ctx.clients.OpenmrsRAWAPI, String(accession));
                    if (!study) {
                        return { ...base, hasImages: false, reportOnly: false, imageCount: 0, images: [] };
                    }
                    const instances = await listInstances(ctx.clients.OpenmrsRAWAPI, study);
                    const images = instances.map((i) =>
                        signImage({ server: ctx.auth.server, study, series: i.series, sop: i.sop }),
                    );
                    return {
                        ...base,
                        hasImages: images.length > 0,
                        reportOnly: false,
                        imageCount: images.length,
                        images,
                    };
                }),
            );
        },
    ),

    /**
     * patientBills — read-only billing & insurance view. One Bill per Odoo customer
     * invoice (account.move) for this patient, with itemized lines (account.move.line)
     * and a coverage block. Identity from the token; calls ONLY search_read.
     */
    /**
     * patientCareStatus — read-only "care in progress" snapshot for the patient's own
     * open visit (Odoo), enriched with the bridge throughput model (current stage,
     * journey steps, pending services, in-hospital signal). No open visit -> inactive.
     */
    patientCareStatus: protectedProcedure.query(async ({ ctx }): Promise<CareStatus> => {
        const inactive: CareStatus = {
            active: false,
            steps: [],
            pending: { lab: 0, radiology: 0, procedure: 0, medication: 0 },
        };
        let open: any;
        try {
            const visits = await ctx.clients.OdooAPI.rpc<any[]>({
                model: "patient.visit",
                method: "search_read",
                args: [[["partner_id.uuid", "=", ctx.auth.uuid]]],
                kwargs: {
                    fields: ["external_uuid", "visit_status", "manual_close_visit", "department", "visit_type", "create_date"],
                    order: "create_date desc",
                    limit: 5,
                },
            });
            open = (visits ?? []).find(
                (v) =>
                    v.visit_status === "open" ||
                    v.visit_status === "requested-close" ||
                    v.manual_close_visit === false,
            );
        } catch {
            return inactive;
        }
        if (!open?.external_uuid) return inactive;

        const base: CareStatus = {
            active: true,
            visitId: String(open.external_uuid),
            workflow: String(open.visit_type ?? "").toLowerCase() || undefined,
            department: open.department || undefined,
            since: open.create_date ? String(open.create_date).replace(" ", "T") : undefined,
            steps: [],
            pending: { lab: 0, radiology: 0, procedure: 0, medication: 0 },
        };

        try {
            const tp = await ctx.clients.BridgeApi<any>(`/views/throughput/visit/${open.external_uuid}`);
            const band = tp?.exitProbability?.band as string | undefined;
            const left = band === "likely_left" || band === "very_likely_left";
            const svc = tp?.metrics?.services ?? {};
            const flow = Array.isArray(tp?.currentMoment?.normalFlow) ? tp.currentMoment.normalFlow : [];
            return {
                ...base,
                // An open-but-already-left visit isn't "in progress" for the patient.
                active: !left,
                inHospital: !left,
                durationHours: tp?.visit?.duration?.durationHours,
                stage: tp?.currentMoment?.label,
                stageDetail: tp?.currentMoment?.rationale,
                steps: flow.map((st: any) => ({
                    key: st.key,
                    label: friendlyStep(st.key, st.label),
                    status: st.status,
                })),
                pending: {
                    lab: svc.lab?.pending ?? 0,
                    radiology: svc.radiology?.pending ?? 0,
                    procedure: svc.procedure?.pending ?? 0,
                    medication: svc.medication?.pending ?? 0,
                },
            };
        } catch {
            return base;
        }
    }),

    patientBills: protectedProcedure.query(async ({ ctx }): Promise<Bill[]> => {
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

        const invoices = await ctx.clients.OdooAPI.rpc<
            {
                id: number;
                name: string | false;
                move_type: string | false;
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
                    // Show charges AND refunds (money returned), so the picture is complete.
                    ["move_type", "in", ["out_invoice", "out_refund"]],
                    ["state", "!=", "cancel"],
                ],
            ],
            kwargs: {
                fields: [
                    "id",
                    "name",
                    "move_type",
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

        // Resolve the ordering doctor for submitted insurance claims via the claim audit
        // (account.move -> visit -> diagnosing practitioner). Fully optional; never breaks billing.
        const orderedByMove = await fetchClaimDoctors(
            ctx,
            invoices.map((i) => i.id),
        );

        return Promise.all(
            invoices.map(async (inv) => {
                let lines: any[] = [];
                try {
                    // Odoo 16: real charge rows carry display_type="product".
                    // (section/note/tax/payment_term rows are not itemized charges, and
                    // the old `exclude_from_invoice_tab` field no longer exists — querying
                    // it threw and silently emptied every bill.)
                    lines = await ctx.clients.OdooAPI.rpc<any[]>({
                        model: "account.move.line",
                        method: "search_read",
                        args: [
                            [
                                ["move_id", "=", inv.id],
                                ["display_type", "=", "product"],
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
                return toBill(inv, lines, { nhisNumber, orderedBy: orderedByMove.get(inv.id) });
            }),
        );
    }),
});

/**
 * For a set of invoices, resolve the diagnosing doctor of the visit each claim belongs
 * to (account.move -> who.insurance.claim_code_audit.visit_id -> patient.visit.diagnosis_by
 * -> emr.practitioner). Returns moveId -> doctor name. Best-effort: any failure -> empty map.
 */
async function fetchClaimDoctors(
    ctx: { clients: ReturnType<typeof createClients> },
    moveIds: number[],
): Promise<Map<number, string>> {
    const out = new Map<number, string>();
    if (!moveIds.length) return out;
    try {
        const audits = await ctx.clients.OdooAPI.rpc<
            { move_id: [number, string] | false; visit_id: [number, string] | false }[]
        >({
            model: "who.insurance.claim_code_audit",
            method: "search_read",
            args: [[["move_id", "in", moveIds]]],
            kwargs: { fields: ["move_id", "visit_id"] },
        });

        const moveToVisit = new Map<number, number>();
        for (const a of audits ?? []) {
            const mid = Array.isArray(a.move_id) ? a.move_id[0] : undefined;
            const vid = Array.isArray(a.visit_id) ? a.visit_id[0] : undefined;
            if (mid && vid) moveToVisit.set(mid, vid);
        }
        const visitIds = [...new Set([...moveToVisit.values()])];
        if (!visitIds.length) return out;

        const visits = await ctx.clients.OdooAPI.rpc<{ id: number; diagnosis_by: number[] }[]>({
            model: "patient.visit",
            method: "search_read",
            args: [[["id", "in", visitIds]]],
            kwargs: { fields: ["id", "diagnosis_by"] },
        });
        const visitToDoc = new Map<number, number>();
        const docIds = new Set<number>();
        for (const v of visits ?? []) {
            const first = v.diagnosis_by?.[0];
            if (first) {
                visitToDoc.set(v.id, first);
                docIds.add(first);
            }
        }
        if (!docIds.size) return out;

        const docs = await ctx.clients.OdooAPI.rpc<{ id: number; name: string }[]>({
            model: "emr.practitioner",
            method: "search_read",
            args: [[["id", "in", [...docIds]]]],
            kwargs: { fields: ["id", "name"] },
        });
        const docName = new Map((docs ?? []).map((d) => [d.id, d.name]));

        for (const [mid, vid] of moveToVisit) {
            const docId = visitToDoc.get(vid);
            const name = docId ? docName.get(docId) : undefined;
            if (name) out.set(mid, name);
        }
    } catch {
        // best-effort enrichment only
    }
    return out;
}

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

/** Patient-friendly labels for the care-journey steps from the bridge throughput model. */
const STEP_LABELS: Record<string, string> = {
    ticket: "Registered",
    doctor_assessment: "Seen by doctor",
    investigations_ordered: "Tests ordered",
    investigations_fulfilled: "Results",
    doctor_review_prescription: "Prescription",
    pharmacy: "Pharmacy",
    exit: "Discharge",
};
function friendlyStep(key: string, fallback?: string): string {
    return STEP_LABELS[key] ?? fallback ?? key;
}

/** Plain-language label for an OpenMRS order fulfillerStatus. */
function fulfillerLabel(status?: string): string {
    switch (String(status)) {
        case "COMPLETED":
            return "Completed";
        case "IN_PROGRESS":
            return "In progress";
        case "RECEIVED":
            return "Received";
        case "DECLINED":
        case "EXCEPTION":
            return "Not done";
        default:
            return "Ordered";
    }
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
}

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
 * Shared lab-observation fetch + DTO mapping for the per-visit and global lab queries.
 * Pulls observations from Odoo (emr.lab_observations), enriches each with its OpenMRS
 * concept reference range (deduped, one call per distinct concept), returns LabResult[].
 */
async function fetchLabResults(
    ctx: { clients: ReturnType<typeof createClients>; auth: TAuthData },
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
