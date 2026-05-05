import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents, incidentChangeHistory, incidentComments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { changeStatusSchema } from '@/features/incidents/schemas';
import { canChangeStatus } from '@/features/incidents/services/permissions-service';
import { validateTransition } from '@/features/incidents/services/state-machine-service';

// POST /api/institutions/[id]/incidents/[incidentId]/status - Change incident status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  try {
    const { id: institutionId, incidentId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user belongs to institution
    if (session.user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Fetch incident
    const [incident] = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.id, incidentId),
          eq(incidents.institutionId, institutionId),
          eq(incidents.isActive, true)
        )
      );

    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    // Check permissions
    if (!canChangeStatus(session.user, incident)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para cambiar el estado de esta incidencia' 
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = changeStatusSchema.parse(body);

    // Validate state transition
    try {
      validateTransition(incident.status as any, validatedData.status);
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Transición de estado inválida' 
      }, { status: 400 });
    }

    // Calculate resolution time if changing to 'resuelta'
    let resolvedAt: Date | null = null;
    let resolutionTime: number | null = null;

    if (validatedData.status === 'resuelta') {
      resolvedAt = new Date();
      resolutionTime = Math.floor((resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60)); // minutes
    }

    // Update incident
    const [updatedIncident] = await db
      .update(incidents)
      .set({
        status: validatedData.status,
        resolvedAt,
        resolutionTime,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId))
      .returning();

    // Record change in history
    await db.insert(incidentChangeHistory).values({
      id: crypto.randomUUID(),
      incidentId,
      changedBy: session.user.id,
      field: 'status',
      oldValue: incident.status,
      newValue: validatedData.status,
      changeType: 'updated',
      metadata: resolvedAt ? { resolvedAt: resolvedAt.toISOString(), resolutionTime } : null,
    });

    // If changing to 'resuelta', create resolution comment
    if (validatedData.status === 'resuelta' && validatedData.resolutionComment) {
      await db.insert(incidentComments).values({
        id: crypto.randomUUID(),
        incidentId,
        authorId: session.user.id,
        content: validatedData.resolutionComment,
        isResolutionComment: true,
      });
    }

    // TODO: Send notifications based on status change
    // - If 'resuelta': notify reporter
    // - If reopened (resuelta -> en_progreso): notify assignee and Admin/PIP

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error changing incident status:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al cambiar el estado de la incidencia' }, { status: 500 });
  }
}
