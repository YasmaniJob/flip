import { z } from 'zod';

/**
 * Validation schemas for date handling
 * 
 * This module provides standardized date validation schemas to ensure
 * consistency across the application.
 */

/**
 * Validates ISO 8601 datetime strings (full format with timezone)
 * Example: "2026-03-22T10:30:00.000Z"
 * 
 * Use for:
 * - Creating/updating records with precise timestamps
 * - Slot dates, due dates, timestamps
 */
export const isoDateTimeSchema = z.string().datetime({
  message: 'Formato de fecha/hora inválido. Use formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)'
});

/**
 * Validates simple date strings (YYYY-MM-DD format)
 * Example: "2026-03-22"
 * 
 * Use for:
 * - Query parameters for date ranges
 * - Date-only filters (no time component needed)
 */
export const simpleDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Formato de fecha inválido. Use formato YYYY-MM-DD'
);

/**
 * Flexible date schema that accepts both ISO datetime and simple date formats
 * Automatically transforms simple dates to ISO datetime format
 * 
 * Use for:
 * - APIs that need to accept both formats
 * - Backward compatibility
 */
export const flexibleDateSchema = z.string().transform((val, ctx) => {
  // Check if it's a simple date (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    // Convert to ISO datetime (start of day UTC)
    return `${val}T00:00:00.000Z`;
  }
  
  // Check if it's already ISO datetime
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fecha inválida',
      });
      return z.NEVER;
    }
    return val;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Formato de fecha inválido. Use YYYY-MM-DD o ISO 8601',
    });
    return z.NEVER;
  }
});

/**
 * Optional ISO datetime schema
 */
export const optionalIsoDateTimeSchema = isoDateTimeSchema.optional();

/**
 * Optional simple date schema
 */
export const optionalSimpleDateSchema = simpleDateSchema.optional();

/**
 * Optional flexible date schema
 */
export const optionalFlexibleDateSchema = flexibleDateSchema.optional();
