import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidentComments, incidents, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { createCommentSchema } from '@/features/incidents/schemas';
import { canAddComment } from '@/features/incidents/services/permissions-service';

// POST /api/institutions/[id]/incidents/[incidentId]/comments - Create comment
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

    // Fetch incident to check permissions
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
    if (!canAddComment(session.user, incident)) {
      return NextResponse.json({ 
        error: 'No tiene permisos para comentar en esta incidencia' 
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createCommentSchema.parse(body);

    // Create comment
    const [comment] = await db.insert(incidentComments).values({
      id: crypto.randomUUID(),
      incidentId,
      authorId: session.user.id,
      content: validatedData.content,
    }).returning();

    // TODO: Send notification to reporter and assignee

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al crear el comentario' }, { status: 500 });
  }
}

// GET /api/institutions/[id]/incidents/[incidentId]/comments - List comments
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

    return NextResponse.json(
      comments.map(c => ({
        ...c.comment,
        author: c.author,
      }))
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error al obtener los comentarios' }, { status: 500 });
  }
}
