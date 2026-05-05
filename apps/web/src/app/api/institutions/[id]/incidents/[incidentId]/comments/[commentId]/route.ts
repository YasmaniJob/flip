import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidentComments, incidents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { updateCommentSchema } from '@/features/incidents/schemas';
import { canEditComment, canDeleteComment } from '@/features/incidents/services/permissions-service';

// PATCH /api/institutions/[id]/incidents/[incidentId]/comments/[commentId] - Update comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string; commentId: string }> }
) {
  try {
    const { id: institutionId, incidentId, commentId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user belongs to institution
    if (session.user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Fetch comment
    const [comment] = await db
      .select()
      .from(incidentComments)
      .where(
        and(
          eq(incidentComments.id, commentId),
          eq(incidentComments.incidentId, incidentId)
        )
      );

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Check permissions (author can edit within 15 minutes)
    if (!canEditComment(session.user, comment)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para editar este comentario. Solo el autor puede editar dentro de los primeros 15 minutos.' 
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateCommentSchema.parse(body);

    // Update comment
    const [updatedComment] = await db
      .update(incidentComments)
      .set({
        content: validatedData.content,
        isEdited: true,
        editedAt: new Date(),
      })
      .where(eq(incidentComments.id, commentId))
      .returning();

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al actualizar el comentario' }, { status: 500 });
  }
}

// DELETE /api/institutions/[id]/incidents/[incidentId]/comments/[commentId] - Delete comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string; commentId: string }> }
) {
  try {
    const { id: institutionId, incidentId, commentId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user belongs to institution
    if (session.user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verify incident exists and belongs to institution
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

    // Fetch comment
    const [comment] = await db
      .select()
      .from(incidentComments)
      .where(
        and(
          eq(incidentComments.id, commentId),
          eq(incidentComments.incidentId, incidentId)
        )
      );

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Check permissions (Admin, PIP, or author can delete)
    if (!canDeleteComment(session.user, comment)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para eliminar este comentario' 
      }, { status: 403 });
    }

    // Delete comment
    await db
      .delete(incidentComments)
      .where(eq(incidentComments.id, commentId));

    return NextResponse.json({ message: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error al eliminar el comentario' }, { status: 500 });
  }
}
