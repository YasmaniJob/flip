import { NextRequest } from 'next/server';
import { requireAuth, requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createResourceSchema, resourcesQuerySchema } from '@/lib/validations/schemas/resources';
import { db } from '@/lib/db';
import { resources, categories, categorySequences } from '@/lib/db/schema';
import { eq, and, sql, like, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Helper: Generate prefix from category name
function generatePrefix(categoryName: string): string {
  return (
    categoryName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase() || 'REC'
  );
}

// Helper: Get next sequence number (atomic upsert)
async function getNextSequence(institutionId: string, prefix: string): Promise<number> {
  const result = await db
    .insert(categorySequences)
    .values({
      id: randomUUID(),
      institutionId,
      categoryPrefix: prefix,
      lastNumber: 1,
    })
    .onConflictDoUpdate({
      target: [categorySequences.institutionId, categorySequences.categoryPrefix],
      set: { lastNumber: sql`${categorySequences.lastNumber} + 1` },
    })
    .returning({ nextNumber: categorySequences.lastNumber });

  return result[0].nextNumber;
}

// Helper: Generate internal ID (PREFIX-NNN)
async function generateInternalId(
  institutionId: string,
  categoryId?: string
): Promise<string> {
  let prefix = 'REC';

  if (categoryId) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (category) {
      prefix = generatePrefix(category.name);
    }
  }

  const nextNumber = await getNextSequence(institutionId, prefix);
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

// GET /api/resources - List resources with filters
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(resourcesQuerySchema, searchParams);

    const { search, categoryId, status, condition } = query;

    // Build where conditions
    const conditions = [eq(resources.institutionId, institutionId)];

    if (categoryId) {
      conditions.push(eq(resources.categoryId, categoryId));
    }

    if (status) {
      conditions.push(eq(resources.status, status));
    }

    if (condition) {
      conditions.push(eq(resources.condition, condition));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(resources.name, term),
          like(resources.brand, term),
          like(resources.model, term),
          like(resources.serialNumber, term),
          like(resources.internalId, term)
        )!
      );
    }

    const whereCondition = and(...conditions);

    const results = await db.query.resources.findMany({
      where: whereCondition,
      orderBy: (r, { asc }) => [asc(r.internalId), asc(r.createdAt)],
    });

    console.log(`[TIMING] resources GET: ${Date.now() - start}ms`);
    return successResponse(results);
  } catch (error) {
    console.log(`[TIMING] resources GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}

// POST /api/resources - Create single resource
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createResourceSchema, body);

    // Generate internal ID with atomic sequence
    const internalId = await generateInternalId(institutionId, data.categoryId);

    // Create resource
    const [resource] = await db
      .insert(resources)
      .values({
        id: randomUUID(),
        institutionId,
        internalId,
        name: data.name,
        categoryId: data.categoryId || null,
        templateId: data.templateId || null,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        status: data.status || 'disponible',
        condition: data.condition || 'bueno',
        stock: data.stock || 1,
        notes: data.notes || null,
        attributes: {},
        maintenanceProgress: 0,
        maintenanceState: null,
      })
      .returning();

    return successResponse(resource, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
