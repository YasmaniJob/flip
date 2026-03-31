/**
 * POST /api/institutions/[id]/diagnostic/reject/[sessionId]
 * 
 * Rejects a pending diagnostic session
 * Requires authentication and institution membership
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.session.activeInstitutionId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: institutionId, sessionId } = params;

    // Verify user belongs to this institution
    if (session.session.activeInstitutionId !== institutionId) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta institución' },
        { status: 403 }
      );
    }

    // Find the diagnostic session
    const diagnosticSession = await db.query.diagnosticSessions.findFirst({
      where: and(
        eq(diagnosticSessions.id, sessionId),
        eq(diagnosticSessions.institutionId, institutionId),
        eq(diagnosticSessions.status, 'completed')
      ),
    });

    if (!diagnosticSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    // Update session status to rejected
    await db
      .update(diagnosticSessions)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: 'Docente rechazado exitosamente',
    });

  } catch (error) {
    console.error('Error rejecting diagnostic session:', error);
    return NextResponse.json(
      { error: 'Error al rechazar docente' },
      { status: 500 }
    );
  }
}
