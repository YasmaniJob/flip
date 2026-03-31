import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateCurricularAreaSchema } from '@/lib/validations/schemas/curricular-areas';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { curricularAreas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateCurricularAreaSchema, body);

    const [updated] = await db
      .update(curricularAreas)
      .set(data)
      .where(and(eq(curricularAreas.id, params.id), eq(curricularAreas.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Área curricular no encontrada');
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

    const [deleted] = await db
      .delete(curricularAreas)
      .where(and(eq(curricularAreas.id, params.id), eq(curricularAreas.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Área curricular no encontrada');
    }

    revalidateTag('config-loadout');

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
