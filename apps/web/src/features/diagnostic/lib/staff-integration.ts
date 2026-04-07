/**
 * Staff Integration for Diagnostic Module
 * Handles approval and creation of staff accounts from diagnostic sessions
 */

import { db } from '@/lib/db';
import { staff, diagnosticSessions } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

export interface ApproveResult {
  success: boolean;
  staffId: string;
  action: 'created' | 'linked';
  message?: string;
}

/**
 * Approve a diagnostic session and create/link staff account
 * Uses transaction to ensure data consistency
 */
export async function approveAndCreateStaff(sessionId: string): Promise<ApproveResult> {
  return await db.transaction(async (tx) => {
    // 1. Get session
    const session = await tx.query.diagnosticSessions.findFirst({
      where: eq(diagnosticSessions.id, sessionId),
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== 'completed') {
      throw new Error('Session must be completed before approval');
    }
    
    // 2. Check if staff already exists with same DNI or email
    const staffConditions = [];
    if (session.dni) staffConditions.push(eq(staff.dni, session.dni));
    if (session.email) staffConditions.push(eq(staff.email, session.email));
    
    const existingStaff = staffConditions.length > 0
      ? await tx.query.staff.findFirst({
          where: and(
            eq(staff.institutionId, session.institutionId),
            staffConditions.length > 1 ? or(...(staffConditions as any)) : staffConditions[0]
          ),
        })
      : null;
    
    if (existingStaff) {
      // 3a. Staff exists → Link session to existing staff
      await tx.update(diagnosticSessions)
        .set({
          staffId: existingStaff.id,
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(diagnosticSessions.id, sessionId));
      
      return {
        success: true,
        staffId: existingStaff.id,
        action: 'linked',
        message: 'Session linked to existing staff member',
      };
    }
    
    // 3b. Staff doesn't exist → Create new staff
    const [newStaff] = await tx.insert(staff)
      .values({
        id: crypto.randomUUID(),
        institutionId: session.institutionId,
        name: session.name,
        dni: session.dni,
        email: session.email,
        role: 'docente',
        status: 'active',
      })
      .returning();
    
    // 4. Link session to new staff
    await tx.update(diagnosticSessions)
      .set({
        staffId: newStaff.id,
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessions.id, sessionId));
    
    return {
      success: true,
      staffId: newStaff.id,
      action: 'created',
      message: 'New staff member created and linked',
    };
  });
}

/**
 * Get pending sessions (completed but not approved)
 */
export async function getPendingSessions(institutionId: string) {
  return await db.query.diagnosticSessions.findMany({
    where: and(
      eq(diagnosticSessions.institutionId, institutionId),
      eq(diagnosticSessions.status, 'completed')
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.completedAt)],
  });
}
