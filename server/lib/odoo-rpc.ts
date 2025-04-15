import type { $Fetch } from "ofetch";

/**
 * Odoo RPC parameter interface
 */
export interface OdooRpcParams<T = any> {
  /** Odoo model name (e.g., 'res.partner') */
  model: string;

  /** Method to call on the model (e.g., 'search_read', 'create') */
  method: string;

  /** Positional arguments to pass to the method */
  args?: any[];

  /** Keyword arguments to pass to the method */
  kwargs?: Record<string, any>;

  /** Optional context to merge with the default context */
  context?: Record<string, any>;
}

/**
 * Odoo RPC response interface
 */
export interface OdooRpcResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data: {
      name: string;
      debug: string;
      message: string;
      arguments: any[];
      exception_type: string;
    };
  };
}

/**
 * Odoo RPC client interface
 */
export interface OdooRpcClient {
  rpc<T = any>(params: OdooRpcParams<T>): Promise<T>;
}

/**
 * Extends an ofetch instance with Odoo RPC capabilities
 */
export function extendWithOdooRpc<T extends $Fetch>(
  client: T,
  opts: { DB: string; USERNAME: string; PASSWORD: string },
): T & OdooRpcClient {
  // Store authentication token
  let authToken: string | null = null;
  let tokenExpiry: number | null = null;

  // Function to authenticate and get token
  async function authenticate(): Promise<string> {
    try {
      const id = Math.floor(Math.random() * 1000000000);
      const authPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "common",
          method: "authenticate",
          args: ["odoo", "emr_sync_user", "Admin@1234", {}],
        },
        id,
      };

      const authResponse = await client("/jsonrpc", {
        method: "POST",
        body: authPayload,
      });

      if (authResponse.error) {
        throw new Error(
          `Odoo Authentication Error: ${authResponse.error.message || JSON.stringify(authResponse.error)}`,
        );
      }

      // Set token expiry to 1 hour from now
      tokenExpiry = Date.now() + 3600000;

      return String(authResponse.result);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Check if token is valid or needs refresh
  async function getValidToken(): Promise<string> {
    if (!authToken || !tokenExpiry || Date.now() >= tokenExpiry) {
      authToken = await authenticate();
    }
    return authToken;
  }

  return Object.assign(client, {
    rpc: async function <T = any>({
      model,
      method,
      args = [],
      kwargs = {},
      context = {},
    }: OdooRpcParams<T>): Promise<T> {
      try {
        // Get valid authentication token
        const userId = await getValidToken();

        // Generate a unique ID for this request
        const id = Math.floor(Math.random() * 1000000000);

        // Merge context if provided
        if (Object.keys(context).length > 0) {
          kwargs = {
            ...kwargs,
            context: {
              ...(kwargs.context || {}),
              ...context,
            },
          };
        }

        // Construct the JSON-RPC payload
        const payload = {
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              opts.DB || "odoo", // Database name
              parseInt(userId),
              "Admin@1234",
              model, // Model name
              method, // Method name
              args, // Positional arguments
              kwargs, // Keyword arguments
            ],
          },
          id,
        };

        // Make the RPC call

        const response = (await client("/jsonrpc", {
          method: "POST",
          body: payload,
        })) as OdooRpcResponse<T>;

        // Check for errors in the response
        if (response.error) {
          // If authentication error, try to re-authenticate once
          if (
            response.error.message?.includes("Access denied") ||
            response.error.data?.message?.includes("Access denied")
          ) {
            authToken = null; // Reset token
            const newUserId = await getValidToken();

            // Update payload with new user ID
            payload.params.args[1] = parseInt(newUserId);

            // Retry the request
            const retryResponse = (await client("/jsonrpc", {
              method: "POST",
              body: payload,
            })) as OdooRpcResponse<T>;

            if (retryResponse.error) {
              throw new Error(
                `Odoo RPC Error after re-auth: ${retryResponse.error.message || JSON.stringify(retryResponse.error)}`,
              );
            }

            return retryResponse.result as T;
          }

          throw new Error(
            `Odoo RPC Error: ${response.error.message || JSON.stringify(response.error)}`,
          );
        }

        return response.result as T;
      } catch (error) {
        throw error;
      }
    },
  });
}
