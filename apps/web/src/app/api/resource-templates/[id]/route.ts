import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateResourceTemplateSchema } from '@/lib/validations/schemas/resource-templates';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { resourceTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/resource-templates/:id - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateResourceTemplateSchema, body);

    const { id } = params;

    const [template] = await db
      .update(resourceTemplates)
      .set({
        categoryId: data.categoryId,
        name: data.name,
        icon: data.icon,
        defaultBrand: data.defaultBrand,
        defaultModel: data.defaultModel,
        isDefault: data.isDefault,
        sortOrder: data.sortOrder,
      })
      .where(and(eq(resourceTemplates.id, id), eq(resourceTemplates.institutionId, institutionId)))
      .returning();

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    return successResponse(template);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/resource-templates/:id - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { id } = params;

    const [template] = await db
      .delete(resourceTemplates)
      .where(and(eq(resourceTemplates.id, id), eq(resourceTemplates.institutionId, institutionId)))
      .returning();

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
