/**
 * POST /api/institutions/[id]/diagnostic/approve-all
 * 
 * Approve all pending diagnostic sessions in batch
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { db } from '@/lib/db';
import { diagnosticSessions, staff } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Get all pending sessions
    const pendingSessions = await db.query.diagnosticSessions.findMany({
      where: and(
        eq(diagnosticSessions.institutionId, institutionId),
        eq(diagnosticSessions.status, 'completed')
      ),
    });
    
    if (pendingSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay sesiones pendientes',
        approved: 0,
        created: 0,
        linked: 0,
      });
    }
    
    // Process all sessions in a transaction
    const result = await db.transaction(async (tx) => {
      let created = 0;
      let linked = 0;
      
      for (const session of pendingSessions) {
        // Check if staff already exists
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
          // Link to existing staff
          await tx.update(diagnosticSessions)
            .set({
              staffId: existingStaff.id,
              status: 'approved',
              updatedAt: new Date(),
            })
            .where(eq(diagnosticSessions.id, session.id));
          
          linked++;
        } else {
          // Create new staff
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
          
          // Link session to new staff
          await tx.update(diagnosticSessions)
            .set({
              staffId: newStaff.id,
              status: 'approved',
              updatedAt: new Date(),
            })
            .where(eq(diagnosticSessions.id, session.id));
          
          created++;
        }
      }
      
      return { created, linked };
    });
    
    revalidateTag('staff');
    revalidateTag('diagnostic-results');
    
    return NextResponse.json({
      success: true,
      message: `${pendingSessions.length} docentes aprobados exitosamente`,
      approved: pendingSessions.length,
      created: result.created,
      linked: result.linked,
    });
    
  } catch (error) {
    console.error('Error approving all sessions:', error);
    return NextResponse.json(
      { error: 'Error al aprobar docentes' },
      { status: 500 }
    );
  }
}
