import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateSectionSchema } from '@/lib/validations/schemas/sections';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { sections } from '@/lib/db/schema';
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
    const data = validateBody(updateSectionSchema, body);

    const [updated] = await db
      .update(sections)
      .set(data)
      .where(and(eq(sections.id, params.id), eq(sections.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Sección no encontrada');
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
      .delete(sections)
      .where(and(eq(sections.id, params.id), eq(sections.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Sección no encontrada');
    }

    revalidateTag('config-loadout');

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
