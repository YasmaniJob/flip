import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateResourceSchema } from '@/lib/validations/schemas/resources';
import { buildPartialUpdate } from '@/lib/utils/patch';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/resources/:id - Update resource (partial update with null support)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateResourceSchema, body);

    const { id } = params;

    // Check if resource exists and belongs to institution
    const existing = await db.query.resources.findFirst({
      where: and(eq(resources.id, id), eq(resources.institutionId, institutionId)),
    });

    if (!existing) {
      throw new NotFoundError('Recurso no encontrado');
    }

    // CRÍTICO: Usar buildPartialUpdate para filtrar undefined pero permitir null
    // Esto permite que maintenanceState: null limpie el campo en la DB
    const patch = buildPartialUpdate(data);

    // Si no hay nada que actualizar, retornar el recurso existente
    if (Object.keys(patch).length === 0) {
      return successResponse(existing);
    }

    // Update resource
    const [updated] = await db
      .update(resources)
      .set(patch)
      .where(and(eq(resources.id, id), eq(resources.institutionId, institutionId)))
      .returning();

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/resources/:id - Delete resource (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin']);
    const institutionId = await getInstitutionId(request);

    const { id } = params;

    // Check if resource exists and belongs to institution
    const existing = await db.query.resources.findFirst({
      where: and(eq(resources.id, id), eq(resources.institutionId, institutionId)),
    });

    if (!existing) {
      throw new NotFoundError('Recurso no encontrado');
    }

    // Delete resource
    await db
      .delete(resources)
      .where(and(eq(resources.id, id), eq(resources.institutionId, institutionId)));

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
