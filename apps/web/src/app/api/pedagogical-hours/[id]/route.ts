import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updatePedagogicalHourSchema } from '@/lib/validations/schemas/pedagogical-hours';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { pedagogicalHours } from '@/lib/db/schema';
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
    const data = validateBody(updatePedagogicalHourSchema, body);

    const [updated] = await db
      .update(pedagogicalHours)
      .set(data)
      .where(and(eq(pedagogicalHours.id, params.id), eq(pedagogicalHours.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Hora pedagógica no encontrada');
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
      .delete(pedagogicalHours)
      .where(and(eq(pedagogicalHours.id, params.id), eq(pedagogicalHours.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Hora pedagógica no encontrada');
    }

    revalidateTag('config-loadout');

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
