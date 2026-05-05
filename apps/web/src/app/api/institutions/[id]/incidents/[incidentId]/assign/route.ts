import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents, incidentChangeHistory, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assignIncidentSchema } from '@/features/incidents/schemas';
import { canAssignIncident } from '@/features/incidents/services/permissions-service';

// POST /api/institutions/[id]/incidents/[incidentId]/assign - Assign incident to user
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

    // Check permissions (only Admin and PIP can assign)
    if (!canAssignIncident(session.user)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para asignar incidencias. Solo Admin y PIP pueden asignar.' 
      }, { status: 403 });
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

    const body = await req.json();
    const validatedData = assignIncidentSchema.parse(body);

    // If assigneeId is provided, verify user exists and belongs to institution
    if (validatedData.assigneeId) {
      const [assignee] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, validatedData.assigneeId),
            eq(users.institutionId, institutionId)
          )
        );

      if (!assignee) {
        return NextResponse.json({ 
          error: 'El usuario asignado no existe o no pertenece a esta institución' 
        }, { status: 400 });
      }
    }

    // Update incident
    const [updatedIncident] = await db
      .update(incidents)
      .set({
        assigneeId: validatedData.assigneeId,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId))
      .returning();

    // Record change in history
    await db.insert(incidentChangeHistory).values({
      id: crypto.randomUUID(),
      incidentId,
      changedBy: session.user.id,
      field: 'assignee',
      oldValue: incident.assigneeId,
      newValue: validatedData.assigneeId,
      changeType: 'updated',
    });

    // TODO: Send notification to new assignee

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error assigning incident:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al asignar la incidencia' }, { status: 500 });
  }
}
