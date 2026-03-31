import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateGradeSchema } from '@/lib/validations/schemas/grades';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { grades, sections } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateGradeSchema, body);

    const [updated] = await db
      .update(grades)
      .set(data)
      .where(and(eq(grades.id, params.id), eq(grades.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Grado no encontrado');
    }

    revalidateTag('config-loadout');

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

    // Verificar que no tenga secciones asociadas
    const [{ value: sectionCount }] = await db
      .select({ value: count() })
      .from(sections)
      .where(eq(sections.gradeId, params.id));

    if (sectionCount > 0) {
      throw new ValidationError(
        `No se puede eliminar: tiene ${sectionCount} sección(es) asociada(s)`
      );
    }

    // Eliminar el grado
    const [deleted] = await db
      .delete(grades)
      .where(and(eq(grades.id, params.id), eq(grades.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Grado no encontrado');
    }

    revalidateTag('config-loadout');

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
