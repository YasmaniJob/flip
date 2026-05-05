import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents, incidentChangeHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { changePrioritySchema } from '@/features/incidents/schemas';
import { canChangeStatus } from '@/features/incidents/services/permissions-service';

// POST /api/institutions/[id]/incidents/[incidentId]/priority - Change incident priority
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

    // Check permissions (Admin, PIP, or Assignee can change priority)
    if (!canChangeStatus(session.user, incident)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para cambiar la prioridad de esta incidencia' 
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = changePrioritySchema.parse(body);

    // Update incident
    const [updatedIncident] = await db
      .update(incidents)
      .set({
        priority: validatedData.priority,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId))
      .returning();

    // Record change in history
    await db.insert(incidentChangeHistory).values({
      id: crypto.randomUUID(),
      incidentId,
      changedBy: session.user.id,
      field: 'priority',
      oldValue: incident.priority,
      newValue: validatedData.priority,
      changeType: 'updated',
    });

    // TODO: If priority changed to 'critica', notify all Admin and PIP

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error changing incident priority:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al cambiar la prioridad de la incidencia' }, { status: 500 });
  }
}
