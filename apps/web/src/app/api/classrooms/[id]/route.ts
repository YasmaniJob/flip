import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateClassroomSchema } from '@/lib/validations/schemas/classrooms';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { classrooms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateClassroomSchema, body);

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await db
        .update(classrooms)
        .set({ isPrimary: false })
        .where(
          and(
            eq(classrooms.institutionId, institutionId),
            eq(classrooms.active, true)
          )
        );
    }

    const [updated] = await db
      .update(classrooms)
      .set(data)
      .where(and(eq(classrooms.id, params.id), eq(classrooms.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Aula no encontrada');
    }

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    // Soft delete
    const [deleted] = await db
      .update(classrooms)
      .set({ active: false })
      .where(and(eq(classrooms.id, params.id), eq(classrooms.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Aula no encontrada');
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
