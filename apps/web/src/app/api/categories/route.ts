import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createCategorySchema, categoriesQuerySchema } from '@/lib/validations/schemas/categories';
import { db } from '@/lib/db';
import { categories, resources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/categories - List categories with optional resource filter
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(categoriesQuerySchema, searchParams);

    const { has_resources } = query;

    // If has_resources filter is requested, join with resources
    if (has_resources === 'true') {
      const categoriesWithResources = await db
        .selectDistinct({ category: categories })
        .from(categories)
        .innerJoin(resources, eq(resources.categoryId, categories.id))
        .where(eq(categories.institutionId, institutionId));

      return successResponse(categoriesWithResources.map((r) => r.category));
    }

    // Otherwise, return all categories
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.institutionId, institutionId));

    return successResponse(allCategories);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/categories - Create category with auto-seed templates
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createCategorySchema, body);

    // Create category
    const [category] = await db
      .insert(categories)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        icon: data.icon || null,
        color: data.color || null,
      })
      .returning();

    return successResponse(category, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
