import { ofetch } from "ofetch";
import { extendWithOdooRpc } from "./odoo-rpc";
import { logger } from "../config/logger";

const createApiInterceptors = (apiName: string) => ({
  async onRequest({ request, options }: any) {
    // Store start time in options for later calculation
    options._requestStartTime = Date.now();

    logger.debug({
      api: `[${apiName}] Request`,
      url: request,
      method: options.method,
      query: options.query,
      body: options.body,
      timestamp: new Date().toISOString(),
    });
  },

  async onRequestError({ request, options, error }: any) {
    const duration = Date.now() - (options._requestStartTime || Date.now());

    logger.error({
      api: `[${apiName}] Request Error`,
      url: request,
      method: options.method,
      error: error.message,
      stack: error.stack,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  },

  async onResponse({ request, response, options }: any) {
    const duration = Date.now() - (options._requestStartTime || Date.now());

    logger.debug({
      api: `[${apiName}] Response`,
      url: request,
      status: response.status,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  },

  async onResponseError({ request, response, options }: any) {
    const duration = Date.now() - (options._requestStartTime || Date.now());

    logger.error(`[${apiName}] Response Error`, {
      url: request,
      status: response.status,
      statusText: response.statusText,
      body: response._data,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  },
});

export function createClients(opts: { BASE_URL: string }) {
  const env = {
    BRIDGE_OPENMRS_ENDPOINT: opts.BASE_URL,
    BRIDGE_ODOO_ENDPOINT: `${opts.BASE_URL}:8069`,
    BRIDGE_SENAITE_ENDPOINT: `${opts.BASE_URL}:8088`,
  };

  const OpenmrsRAWAPI = ofetch.create({
    baseURL: `${env.BRIDGE_OPENMRS_ENDPOINT}`,
    ...createApiInterceptors("OPENMRS_RAW"),
    headers: {
      Authorization: `Basic ${btoa(`superman:7Pradesh@EMR`)}`,
    },
    retry: 1,
  });

  const OpenmrsAPI = ofetch.create({
    baseURL: `${env.BRIDGE_OPENMRS_ENDPOINT}/openmrs/ws/rest/v1/`,
    ...createApiInterceptors("OPENMRS"),
    headers: {
      Authorization: `Basic ${btoa(`superman:7Pradesh@EMR`)}`,
    },
    retry: 1,
  });

  const OpenmrsFHIRAPI = ofetch.create({
    baseURL: `${env.BRIDGE_OPENMRS_ENDPOINT}/openmrs/ws/fhir2/R4/`,
    ...createApiInterceptors("OPENMRS_FHIR"),
    headers: {
      Authorization: `Basic ${btoa(`superman:7Pradesh@EMR`)}`,
    },
    retry: 1,
  });

  // Create the base OdooAPI instance
  const OdooAPI = extendWithOdooRpc(
    ofetch.create({
      baseURL: env.BRIDGE_ODOO_ENDPOINT,
      ...createApiInterceptors("ODOO"),
      headers: {
        Authorization: `Basic ${btoa(`emr_sync_user:Admin@1234`)}`,
        "Content-Type": "application/json",
      },
      retry: 1,
    }),
    { DB: "odoo", PASSWORD: "odoo", USERNAME: "odoo" },
  );

  // Create the base SenaiteAPI instance
  const SenaiteAPI = ofetch.create({
    baseURL: env.BRIDGE_SENAITE_ENDPOINT,
    ...createApiInterceptors("SENAITE"),
    headers: {
      Authorization: `Basic ${btoa(`admin:admin`)}`,
      "Content-Type": "application/json",
    },
    retry: 1,
  });

  return {
    OpenmrsRAWAPI,
    OpenmrsAPI,
    OpenmrsFHIRAPI,
    OdooAPI,
    SenaiteAPI,
  };
}

export function createERPClient(opts: { BASE_URL: string }) {
  return extendWithOdooRpc(
    ofetch.create({
      baseURL: `${opts.BASE_URL}:8069`,
      headers: {
        Authorization: `Basic ${btoa(`emr_sync_user:7Pradesh@EMR`)}`,
        "Content-Type": "application/json",
      },
      retry: 1,
    }),
    { DB: "odoo", PASSWORD: "odoo", USERNAME: "odoo" },
  );
}
