import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateCategorySchema } from '@/lib/validations/schemas/categories';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { categories, resources } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// PUT /api/categories/:id - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateCategorySchema, body);

    const { id } = params;

    const [category] = await db
      .update(categories)
      .set({
        name: data.name,
        icon: data.icon,
        color: data.color,
      })
      .where(and(eq(categories.id, id), eq(categories.institutionId, institutionId)))
      .returning();

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    return successResponse(category);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/categories/:id - Delete category (validate no resources)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { id } = params;

    // Check if category exists
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.institutionId, institutionId)),
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Check if category has resources
    const [resourceCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(resources)
      .where(eq(resources.categoryId, id));

    const resourceCount = Number(resourceCountResult?.count || 0);

    if (resourceCount > 0) {
      throw new ValidationError(
        `No se puede eliminar: ${resourceCount} recurso(s) usan esta categoría`
      );
    }

    // Delete category
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.institutionId, institutionId)));

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
