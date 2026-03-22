import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/utils/errors';

/**
 * Validates request body against a Zod schema
 * @throws ValidationError if validation fails
 */
export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        'Datos inválidos',
        error.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        }))
      );
    }
    throw error;
  }
}

/**
 * Validates query parameters against a Zod schema
 * @throws ValidationError if validation fails
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  params: URLSearchParams | ReadonlyURLSearchParams | Record<string, string | string[] | undefined>
): T {
  // Si params ya es un objeto plano, usarlo directamente
  const obj = params instanceof URLSearchParams || 'entries' in params
    ? Object.fromEntries(params.entries())
    : params;
  return validateBody(schema, obj);
}

// Type for Next.js readonly search params
type ReadonlyURLSearchParams = {
  entries(): IterableIterator<[string, string]>;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
  forEach(callbackfn: (value: string, key: string) => void): void;
};
