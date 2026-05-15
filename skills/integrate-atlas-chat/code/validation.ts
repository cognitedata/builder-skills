/**
 * Runtime validation for tool arguments using ajv.
 *
 * Ported from pi-mono packages/ai/src/utils/validation.ts pattern:
 * - Singleton ajv instance with coercion
 * - Graceful degradation if ajv fails to initialise (CSP)
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { TSchema } from '@sinclair/typebox';

let ajvInstance: Ajv | null = null;

function getAjv(): Ajv | null {
  if (ajvInstance) return ajvInstance;

  try {
    ajvInstance = new Ajv({ allErrors: true, strict: false, coerceTypes: true });
    addFormats(ajvInstance);
    return ajvInstance;
  } catch {
    // Graceful degradation — skip validation if ajv cannot initialise
    return null;
  }
}

/**
 * Validate and coerce tool arguments against a TypeBox / JSON Schema.
 * Throws a formatted error on validation failure.
 * Gracefully skips validation when ajv is unavailable (e.g. CSP).
 */
export function validateToolArguments(
  toolName: string,
  schema: TSchema,
  args: unknown,
): void {
  const ajv = getAjv();
  if (!ajv) return;

  const validate = ajv.compile(schema);
  const valid = validate(args);
  if (valid) return;

  const errors = validate.errors
    ?.map((e) => `${e.instancePath || '/'} ${e.message}`)
    .join('; ');
  throw new Error(`Tool "${toolName}" received invalid arguments: ${errors}`);
}
