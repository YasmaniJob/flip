/**
 * POST /api/institutions/[id]/diagnostic/reject-all
 * 
 * Reject all pending diagnostic sessions in batch
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { db } from '@/lib/db';
import { diagnosticSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
    
    // Update all pending sessions to rejected in a single query
    const result = await db
      .update(diagnosticSessions)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticSessions.institutionId, institutionId),
          eq(diagnosticSessions.status, 'completed')
        )
      )
      .returning({ id: diagnosticSessions.id });
    
    return NextResponse.json({
      success: true,
      message: `${result.length} docentes rechazados exitosamente`,
      rejected: result.length,
    });
    
  } catch (error) {
    console.error('Error rejecting all sessions:', error);
    return NextResponse.json(
      { error: 'Error al rechazar docentes' },
      { status: 500 }
    );
  }
}
