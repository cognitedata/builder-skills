/**
 * Generic Cognite CDF Function caller.
 *
 * Framework-agnostic — no React or app-specific dependencies.
 * Copy into src/services/ (or equivalent) of any Flows/Fusion app.
 *
 * Usage:
 *   import { callCogniteFunction, CogniteFunctionError } from "./cogniteFunctionService";
 *
 *   const result = await callCogniteFunction<MyInput, MyOutput>(
 *     client,
 *     12345678,      // numeric CDF function ID
 *     { foo: "bar" },
 *   );
 */

import type { CogniteClient } from "@cognite/sdk";

// ============================================================
// Error type
// ============================================================

export class CogniteFunctionError extends Error {
  readonly status?: number;
  readonly callId?: number;

  constructor(
    message: string,
    options: { cause?: unknown; status?: number; callId?: number } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "CogniteFunctionError";
    this.status = options.status;
    this.callId = options.callId;
  }
}

// ============================================================
// Options
// ============================================================

export interface CallCogniteFunctionOptions {
  /**
   * Maximum number of poll attempts before giving up.
   * Default: 120 (≈ 6 minutes at 3 s intervals).
   */
  maxPollAttempts?: number;
  /**
   * Base interval between poll attempts in milliseconds.
   * ±20 % jitter is applied automatically. Default: 3000.
   */
  pollIntervalMs?: number;
  /** Optional AbortSignal to cancel the poll loop. */
  signal?: AbortSignal;
}

// ============================================================
// Internal helpers
// ============================================================

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/** The Cognite SDK wraps responses in `{ data: T }`. */
function unwrap<T>(res: { data?: unknown }): T {
  return res.data as T;
}

function getHttpStatus(error: unknown): number | undefined {
  if (error !== null && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    if (typeof rec.status === "number") return rec.status;
    const response = rec.response as Record<string, unknown> | undefined;
    if (response && typeof response.status === "number") return response.status;
  }
  return undefined;
}

function throwFunctionError(
  error: unknown,
  message: string,
  callId?: number,
): never {
  throw new CogniteFunctionError(message, {
    cause: error,
    status: getHttpStatus(error),
    callId,
  });
}

// ============================================================
// Public API
// ============================================================

/**
 * Call any deployed Cognite CDF Function.
 *
 * Steps:
 *  1. Obtain a session nonce (token exchange) so the function can call CDF APIs.
 *  2. Invoke the function with the provided data.
 *  3. Poll until status === "Completed" (throws on "Failed" / "Timeout" / max attempts).
 *  4. Return the function's response payload cast to TOutput.
 *
 * @param client     Authenticated CogniteClient from the Flows/Fusion SDK context.
 * @param functionId Numeric CDF function ID. If you only have an external ID, resolve
 *                   it via GET /api/v1/projects/{project}/functions first.
 * @param data       JSON-serialisable input — passed as the function's `data` argument.
 * @param opts       Optional polling configuration and abort signal.
 */
export async function callCogniteFunction<TInput, TOutput>(
  client: CogniteClient,
  functionId: string | number,
  data: TInput,
  opts: CallCogniteFunctionOptions = {},
): Promise<TOutput> {
  const {
    maxPollAttempts = 120,
    pollIntervalMs = 3_000,
    signal,
  } = opts;

  const project = client.project;
  const fnId = String(functionId);

  // Step 1: Obtain session nonce via token exchange.
  let nonce: string;
  try {
    const sessionRes = await client.post(
      `/api/v1/projects/${project}/sessions`,
      { data: { items: [{ tokenExchange: true }] } },
    );
    nonce = unwrap<{ items: { nonce: string }[] }>(sessionRes).items[0].nonce;
  } catch (error) {
    throwFunctionError(error, "Failed to obtain session nonce for CDF function call");
  }

  // Step 2: Invoke the function.
  let callId: number;
  try {
    const callRes = await client.post(
      `/api/v1/projects/${project}/functions/${fnId}/call`,
      { data: { data, nonce } },
    );
    callId = unwrap<{ id: number }>(callRes).id;
  } catch (error) {
    throwFunctionError(error, `Failed to invoke CDF function ${fnId}`);
  }

  // Step 3: Poll for completion.
  const statusUrl = `/api/v1/projects/${project}/functions/${fnId}/calls/${callId}`;

  for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
    // Jitter ±20 % to avoid thundering-herd when multiple tabs poll simultaneously.
    await sleep(pollIntervalMs * (0.8 + 0.4 * Math.random()), signal);

    let status: string;
    try {
      const statusRes = await client.get(statusUrl);
      status = unwrap<{ status: string }>(statusRes).status;
    } catch (error) {
      throwFunctionError(
        error,
        `Failed to poll CDF function call status (attempt ${attempt + 1})`,
        callId,
      );
    }

    if (status === "Failed" || status === "Timeout") {
      throw new CogniteFunctionError(
        `CDF function ${fnId} ended with status: ${status}`,
        { callId },
      );
    }

    if (status === "Completed") {
      // Step 4: Fetch and return the response.
      try {
        const responseRes = await client.get(`${statusUrl}/response`);
        return unwrap<{ response: TOutput }>(responseRes).response;
      } catch (error) {
        throwFunctionError(
          error,
          `Failed to fetch CDF function response for call ${callId}`,
          callId,
        );
      }
    }
    // status === "Running" or "Scheduled" — keep polling.
  }

  throw new CogniteFunctionError(
    `CDF function ${fnId} did not complete after ${maxPollAttempts} poll attempts`,
    { callId },
  );
}
