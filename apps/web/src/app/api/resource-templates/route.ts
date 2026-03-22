import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import {
  createResourceTemplateSchema,
  resourceTemplatesQuerySchema,
} from '@/lib/validations/schemas/resource-templates';
import { db } from '@/lib/db';
import { resourceTemplates } from '@/lib/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/resource-templates - List templates with optional category filter
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(resourceTemplatesQuerySchema, searchParams);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { categoryId } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(resourceTemplates.institutionId, institutionId)];
    if (categoryId) {
      conditions.push(eq(resourceTemplates.categoryId, categoryId));
    }

    const whereCondition = and(...conditions);

    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(resourceTemplates)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(resourceTemplates.sortOrder), asc(resourceTemplates.name)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(resourceTemplates)
        .where(whereCondition),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return paginatedResponse(results, {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/resource-templates - Create template
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createResourceTemplateSchema, body);

    const [template] = await db
      .insert(resourceTemplates)
      .values({
        id: randomUUID(),
        institutionId,
        categoryId: data.categoryId || null,
        name: data.name,
        icon: data.icon || null,
        defaultBrand: data.defaultBrand || null,
        defaultModel: data.defaultModel || null,
        isDefault: data.isDefault || false,
        sortOrder: data.sortOrder || 0,
      })
      .returning();

    return successResponse(template, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
