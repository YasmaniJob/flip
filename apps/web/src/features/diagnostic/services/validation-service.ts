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
import { eq, and, or } from 'drizzle-orm';

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
 * (identified by staffId, userId, email, or dni) in the specified year.
 * 
 * @param institutionId - The institution ID
 * @param staffId - The staff ID (for registered teachers) - can be null
 * @param userId - The user ID (for logged-in users) - can be null
 * @param year - The year to check
 * @param email - The email (for unregistered users) - can be null
 * @param dni - The DNI (for unregistered users) - can be null
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
  year: number,
  email?: string | null,
  dni?: string | null
): Promise<typeof diagnosticSessions.$inferSelect | null> {
  // At least one identifier must be provided
  if (!staffId && !userId && !email && !dni) {
    throw new Error('At least one identifier (staffId, userId, email, or dni) must be provided');
  }
  
  // Build the where clause based on which identifiers are provided
  const baseConditions = [
    eq(diagnosticSessions.institutionId, institutionId),
    eq(diagnosticSessions.year, year),
    eq(diagnosticSessions.status, 'completed'), // Only check completed sessions
  ];
  
  // Build OR conditions for all available identifiers
  let whereClause: any;
  
  if (staffId && userId && email && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.email, email),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (staffId && userId && email) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.email, email)
    ));
  } else if (staffId && userId && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (staffId && email && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.email, email),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (userId && email && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.email, email),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (staffId && userId) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.userId, userId)
    ));
  } else if (staffId && email) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.email, email)
    ));
  } else if (staffId && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.staffId, staffId),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (userId && email) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.email, email)
    ));
  } else if (userId && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.userId, userId),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (email && dni) {
    whereClause = and(...baseConditions, or(
      eq(diagnosticSessions.email, email),
      eq(diagnosticSessions.dni, dni)
    ));
  } else if (staffId) {
    whereClause = and(...baseConditions, eq(diagnosticSessions.staffId, staffId));
  } else if (userId) {
    whereClause = and(...baseConditions, eq(diagnosticSessions.userId, userId));
  } else if (email) {
    whereClause = and(...baseConditions, eq(diagnosticSessions.email, email));
  } else if (dni) {
    whereClause = and(...baseConditions, eq(diagnosticSessions.dni, dni));
  }
  
  const session = await db.query.diagnosticSessions.findFirst({
    where: whereClause,
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
 * @param userId - The user ID (for logged-in users) - can be null
 * @param year - The year to validate
 * @param email - The email (for unregistered users) - can be null
 * @param dni - The DNI (for unregistered users) - can be null
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
  year: number,
  email?: string | null,
  dni?: string | null
): Promise<ValidationResult> {
  // Validate inputs
  if (!institutionId) {
    return {
      valid: false,
      reason: 'Institution ID is required',
    };
  }
  
  // At least one identifier must be provided
  if (!staffId && !userId && !email && !dni) {
    return {
      valid: false,
      reason: 'At least one identifier (staffId, userId, email, or dni) must be provided',
    };
  }
  
  if (year < 2026) {
    return {
      valid: false,
      reason: 'Year must be 2026 or later',
    };
  }
  
  // Check for existing session
  const existingSession = await checkExistingSession(
    institutionId,
    staffId,
    userId,
    year,
    email,
    dni
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
 * @param userId - The user ID (for logged-in users) - can be null
 * @param email - The email (for unregistered users) - can be null
 * @param dni - The DNI (for unregistered users) - can be null
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
  userId: string | null,
  email?: string | null,
  dni?: string | null
): Promise<ValidationResult> {
  const currentYear = new Date().getFullYear();
  return validateUniqueSession(institutionId, staffId, userId, currentYear, email, dni);
}
