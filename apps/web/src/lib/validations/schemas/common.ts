import { z } from 'zod';

/**
 * Pagination schema for query parameters
 * Coerces strings to numbers and provides defaults
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

/**
 * ID parameter schema for route params
 */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
