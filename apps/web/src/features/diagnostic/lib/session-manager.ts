/**
 * Session Management for Diagnostic Module
 */

import { db } from '@/lib/db';
import { diagnosticSessions, staff } from '@/lib/db/schema';
import { eq, and, gt, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const SESSION_EXPIRY_DAYS = 7;

export interface CreateSessionData {
  institutionId: string;
  name: string;
  dni: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  totalQuestions: number;
}

export interface SessionValidation {
  valid: boolean;
  session?: typeof diagnosticSessions.$inferSelect;
  reason?: string;
}

/**
 * Create a new diagnostic session or resume existing one
 */
export async function createOrResumeSession(data: CreateSessionData) {
  // Check if there's an existing active session for this person
  const existingSession = await db.query.diagnosticSessions.findFirst({
    where: and(
      eq(diagnosticSessions.institutionId, data.institutionId),
      or(
        data.dni ? eq(diagnosticSessions.dni, data.dni) : undefined,
        data.email ? eq(diagnosticSessions.email, data.email) : undefined
      ),
      gt(diagnosticSessions.expiresAt, new Date()),
      eq(diagnosticSessions.status, 'in_progress')
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
  });
  
  if (existingSession) {
    // Resume existing session
    return {
      session: existingSession,
      token: existingSession.token,
      isResuming: true,
    };
  }
  
  // Create new session
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  
  const [session] = await db.insert(diagnosticSessions)
    .values({
      id: randomUUID(),
      token,
      institutionId: data.institutionId,
      name: data.name,
      dni: data.dni,
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: 'in_progress',
      progress: 0,
      totalQuestions: data.totalQuestions,
      expiresAt,
    })
    .returning();
  
  return {
    session,
    token,
    isResuming: false,
  };
}


/**
 * Validate a session token
 */
export async function validateSession(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionValidation> {
  const session = await db.query.diagnosticSessions.findFirst({
    where: and(
      eq(diagnosticSessions.token, token),
      gt(diagnosticSessions.expiresAt, new Date())
    ),
  });
  
  if (!session) {
    return {
      valid: false,
      reason: 'Session not found or expired',
    };
  }
  
  // Optional: Validate IP/UserAgent (can be strict or just log)
  const ipChanged = ipAddress && session.ipAddress && ipAddress !== session.ipAddress;
  const uaChanged = userAgent && session.userAgent && userAgent !== session.userAgent;
  
  if (ipChanged || uaChanged) {
    console.warn('Session security warning:', {
      token,
      ipChanged,
      uaChanged,
      sessionId: session.id,
    });
    // For now, just log. In production, you might want to reject or require re-authentication
  }
  
  return {
    valid: true,
    session,
  };
}

/**
 * Check if a person already has a staff account
 */
export async function findExistingStaff(institutionId: string, dni?: string, email?: string) {
  if (!dni && !email) return null;
  
  return await db.query.staff.findFirst({
    where: and(
      eq(staff.institutionId, institutionId),
      or(
        dni ? eq(staff.dni, dni) : undefined,
        email ? eq(staff.email, email) : undefined
      )
    ),
  });
}
