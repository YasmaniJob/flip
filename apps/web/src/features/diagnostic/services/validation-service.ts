/**
 * Validation Service for Annual Periodization
 * 
 * Handles validation of diagnostic session uniqueness per year.
 * Ensures that each teacher can only complete one diagnostic per calendar year.
 * 
 * @module ValidationService
 */

import { db } from '@/lib/db';
import { diagnosticSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Result of session validation
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  existingYear?: number;
  existingSessionId?: string;
  completedAt?: Date;
}

/**
 * Check if a session already exists for a teacher in a specific year
 * 
 * This function searches for an existing diagnostic session for the given teacher
 * (identified by staffId or userId) in the specified year.
 * 
 * @param institutionId - The institution ID
 * @param staffId - The staff ID (for registered teachers) - can be null
 * @param userId - The user ID (for temporary users) - can be null
 * @param year - The year to check
 * @returns The existing session if found, null otherwise
 * 
 * @example
 * const session = await checkExistingSession('inst-1', 'staff-1', null, 2026);
 * if (session) {
 *   console.log('Already completed in 2026');
 * }
 */
export async function checkExistingSession(
  institutionId: string,
  staffId: string | null,
  userId: string | null,
  year: number
): Promise<typeof diagnosticSessions.$inferSelect | null> {
  // At least one of staffId or userId must be provided
  if (!staffId && !userId) {
    throw new Error('Either staffId or userId must be provided');
  }
  
  // Build the where clause based on which identifier is provided
  const whereConditions = [
    eq(diagnosticSessions.institutionId, institutionId),
    eq(diagnosticSessions.year, year),
    eq(diagnosticSessions.status, 'completed'), // Only check completed sessions
  ];
  
  if (staffId) {
    whereConditions.push(eq(diagnosticSessions.staffId, staffId));
  } else if (userId) {
    whereConditions.push(eq(diagnosticSessions.userId, userId));
  }
  
  const session = await db.query.diagnosticSessions.findFirst({
    where: and(...whereConditions),
  });
  
  return session || null;
}

/**
 * Validate that a new session can be created (no duplicate for the year)
 * 
 * This function checks if a teacher can complete a diagnostic for the specified year.
 * It returns a validation result indicating whether the session is valid or not.
 * 
 * @param institutionId - The institution ID
 * @param staffId - The staff ID (for registered teachers) - can be null
 * @param userId - The user ID (for temporary users) - can be null
 * @param year - The year to validate
 * @returns ValidationResult with valid flag and optional error details
 * 
 * @example
 * const result = await validateUniqueSession('inst-1', 'staff-1', null, 2026);
 * if (!result.valid) {
 *   console.error(result.reason);
 * }
 */
export async function validateUniqueSession(
  institutionId: string,
  staffId: string | null,
  userId: string | null,
  year: number
): Promise<ValidationResult> {
  // Validate inputs
  if (!institutionId) {
    return {
      valid: false,
      reason: 'Institution ID is required',
    };
  }
  
  if (!staffId && !userId) {
    return {
      valid: false,
      reason: 'Either staffId or userId must be provided',
    };
  }
  
  if (year < 2025) {
    return {
      valid: false,
      reason: 'Year must be 2025 or later',
    };
  }
  
  // Check for existing session
  const existingSession = await checkExistingSession(
    institutionId,
    staffId,
    userId,
    year
  );
  
  if (existingSession) {
    return {
      valid: false,
      reason: `Ya existe un diagnóstico completado para el año ${year}`,
      existingYear: existingSession.year,
      existingSessionId: existingSession.id,
      completedAt: existingSession.completedAt || undefined,
    };
  }
  
  return {
    valid: true,
  };
}

/**
 * Check if a teacher can complete a diagnostic for the current year
 * 
 * This is a convenience function that combines year detection with validation.
 * 
 * @param institutionId - The institution ID
 * @param staffId - The staff ID (for registered teachers) - can be null
 * @param userId - The user ID (for temporary users) - can be null
 * @returns ValidationResult for the current year
 * 
 * @example
 * const result = await canCompleteThisYear('inst-1', 'staff-1', null);
 * if (result.valid) {
 *   // Allow teacher to start diagnostic
 * }
 */
export async function canCompleteThisYear(
  institutionId: string,
  staffId: string | null,
  userId: string | null
): Promise<ValidationResult> {
  const currentYear = new Date().getFullYear();
  return validateUniqueSession(institutionId, staffId, userId, currentYear);
}
