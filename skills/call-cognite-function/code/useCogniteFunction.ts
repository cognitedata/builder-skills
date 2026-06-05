/**
 * useCogniteFunction — React hook for calling any Cognite CDF Function.
 *
 * Wraps cogniteFunctionService with isLoading / error / result state and
 * automatic cleanup on unmount (AbortController).
 *
 * Copy into src/hooks/ and adjust the useCdfClient import to match your
 * project's SDK context provider.
 *
 * Usage:
 *   const { call, isLoading, error, result, reset } =
 *     useCogniteFunction<MyInput, MyOutput>(12345678);
 *
 *   // in an event handler or useEffect:
 *   const output = await call({ foo: "bar" });
 */

import { useCallback, useEffect, useRef, useState } from "react";
// Adjust this import to your project's SDK context:
import { useCdfClient } from "@/contexts/CdfClientContext";
import {
  callCogniteFunction,
  CogniteFunctionError,
  type CallCogniteFunctionOptions,
} from "./cogniteFunctionService";

export interface UseCogniteFunctionResult<TInput, TOutput> {
  /** Call the function with the given input. Resolves with the output or throws CogniteFunctionError. */
  call: (data: TInput, opts?: Omit<CallCogniteFunctionOptions, "signal">) => Promise<TOutput>;
  isLoading: boolean;
  error: string | null;
  result: TOutput | null;
  reset: () => void;
}

/**
 * @param functionId Numeric CDF function ID.
 * @param defaultOpts Default poll options — can be overridden per call().
 */
export function useCogniteFunction<TInput, TOutput>(
  functionId: string | number,
  defaultOpts: Omit<CallCogniteFunctionOptions, "signal"> = {},
): UseCogniteFunctionResult<TInput, TOutput> {
  const { sdk } = useCdfClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TOutput | null>(null);

  // Abort controller lives in a ref so it survives re-renders without causing them.
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight call when the component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const call = useCallback(
    async (
      data: TInput,
      callOpts: Omit<CallCogniteFunctionOptions, "signal"> = {},
    ): Promise<TOutput> => {
      if (!sdk) {
        const msg = "CDF SDK is not available";
        setError(msg);
        throw new Error(msg);
      }

      // Cancel any previous in-flight call before starting a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const output = await callCogniteFunction<TInput, TOutput>(
          sdk,
          functionId,
          data,
          { ...defaultOpts, ...callOpts, signal: controller.signal },
        );
        setResult(output);
        return output;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Unmount / deliberate cancel — don't update state.
          throw err;
        }
        const msg =
          err instanceof CogniteFunctionError || err instanceof Error
            ? err.message
            : "CDF function call failed";
        setError(msg);
        setResult(null);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sdk, functionId],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { call, isLoading, error, result, reset };
}
