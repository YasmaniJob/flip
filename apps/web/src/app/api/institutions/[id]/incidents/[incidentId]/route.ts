import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents, incidentChangeHistory, incidentComments, incidentAttachments, users, resources } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { updateIncidentSchema } from '@/features/incidents/schemas';
import { canEditIncident, canDeleteIncident } from '@/features/incidents/services/permissions-service';

// GET /api/institutions/[id]/incidents/[incidentId] - Get incident detail
export async function GET(
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

    // Fetch incident with all relations
    const [incident] = await db
      .select({
        incident: incidents,
        reporter: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        resource: {
          id: resources.id,
          name: resources.name,
          internalId: resources.internalId,
          categoryId: resources.categoryId,
        },
      })
      .from(incidents)
      .leftJoin(users, eq(incidents.reporterId, users.id))
      .leftJoin(resources, eq(incidents.resourceId, resources.id))
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

    // Fetch assignee separately if exists
    let assignee = null;
    if (incident.incident.assigneeId) {
      const [assigneeData] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, incident.incident.assigneeId));
      assignee = assigneeData;
    }

    // Fetch comments with authors
    const comments = await db
      .select({
        comment: incidentComments,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(incidentComments)
      .leftJoin(users, eq(incidentComments.authorId, users.id))
      .where(eq(incidentComments.incidentId, incidentId))
      .orderBy(incidentComments.createdAt);

    // Fetch attachments
    const attachments = await db
      .select()
      .from(incidentAttachments)
      .where(eq(incidentAttachments.incidentId, incidentId))
      .orderBy(incidentAttachments.createdAt);

    // Fetch change history
    const changeHistory = await db
      .select({
        history: incidentChangeHistory,
        changedByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(incidentChangeHistory)
      .leftJoin(users, eq(incidentChangeHistory.changedBy, users.id))
      .where(eq(incidentChangeHistory.incidentId, incidentId))
      .orderBy(desc(incidentChangeHistory.createdAt));

    return NextResponse.json({
      ...incident.incident,
      reporter: incident.reporter,
      assignee,
      resource: incident.resource,
      comments: comments.map(c => ({
        ...c.comment,
        author: c.author,
      })),
      attachments,
      changeHistory: changeHistory.map(h => ({
        ...h.history,
        changedByUser: h.changedByUser,
      })),
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Error al obtener la incidencia' }, { status: 500 });
  }
}

// PATCH /api/institutions/[id]/incidents/[incidentId] - Update incident
export async function PATCH(
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

    // Fetch existing incident
    const [existingIncident] = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.id, incidentId),
          eq(incidents.institutionId, institutionId),
          eq(incidents.isActive, true)
        )
      );

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    // Check permissions
    if (!canEditIncident(session.user, existingIncident)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para editar esta incidencia. Los reporteros solo pueden editar dentro de las primeras 24 horas.' 
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateIncidentSchema.parse(body);

    // Track changes for history
    const changes: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (validatedData.title && validatedData.title !== existingIncident.title) {
      changes.push({ field: 'title', oldValue: existingIncident.title, newValue: validatedData.title });
    }
    if (validatedData.description && validatedData.description !== existingIncident.description) {
      changes.push({ field: 'description', oldValue: existingIncident.description, newValue: validatedData.description });
    }
    if (validatedData.type && validatedData.type !== existingIncident.type) {
      changes.push({ field: 'type', oldValue: existingIncident.type, newValue: validatedData.type });
    }
    if (validatedData.priority && validatedData.priority !== existingIncident.priority) {
      changes.push({ field: 'priority', oldValue: existingIncident.priority, newValue: validatedData.priority });
    }
    if (validatedData.resourceId !== undefined && validatedData.resourceId !== existingIncident.resourceId) {
      changes.push({ field: 'resource', oldValue: existingIncident.resourceId, newValue: validatedData.resourceId });
    }
    if (validatedData.location !== undefined && validatedData.location !== existingIncident.location) {
      changes.push({ field: 'location', oldValue: existingIncident.location, newValue: validatedData.location });
    }

    // Update incident
    const [updatedIncident] = await db
      .update(incidents)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId))
      .returning();

    // Record changes in history
    for (const change of changes) {
      await db.insert(incidentChangeHistory).values({
        id: crypto.randomUUID(),
        incidentId,
        changedBy: session.user.id,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeType: 'updated',
      });
    }

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error updating incident:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al actualizar la incidencia' }, { status: 500 });
  }
}

// DELETE /api/institutions/[id]/incidents/[incidentId] - Soft delete incident
export async function DELETE(
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

    // Check permissions
    if (!canDeleteIncident(session.user)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para eliminar incidencias. Solo Admin y PIP pueden eliminar.' 
      }, { status: 403 });
    }

    // Fetch existing incident
    const [existingIncident] = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.id, incidentId),
          eq(incidents.institutionId, institutionId),
          eq(incidents.isActive, true)
        )
      );

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    // Soft delete
    await db
      .update(incidents)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId));

    // Record deletion in history
    await db.insert(incidentChangeHistory).values({
      id: crypto.randomUUID(),
      incidentId,
      changedBy: session.user.id,
      field: 'isActive',
      oldValue: 'true',
      newValue: 'false',
      changeType: 'deleted',
    });

    return NextResponse.json({ message: 'Incidencia eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Error al eliminar la incidencia' }, { status: 500 });
  }
}
