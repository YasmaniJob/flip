import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { batchCreateResourceSchema } from '@/lib/validations/schemas/resources';
import { db } from '@/lib/db';
import { resources, categories, categorySequences } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
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

// POST /api/resources/batch - Create multiple resources with sequential IDs
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(batchCreateResourceSchema, body);

    const { resource: resourceDto, quantity, items } = data;

    // Determine prefix
    let prefix = 'REC';
    if (resourceDto.categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, resourceDto.categoryId),
      });

      if (category) {
        prefix = generatePrefix(category.name);
      }
    }

    const createdResources = [];

    // CRÍTICO: Loop secuencial (NO Promise.all) para garantizar IDs consecutivos
    // Cada iteración debe esperar la anterior para obtener el siguiente número de secuencia
    for (let i = 0; i < quantity; i++) {
      const nextNumber = await getNextSequence(institutionId, prefix);
      const internalId = `${prefix}-${String(nextNumber).padStart(3, '0')}`;
      
      // Obtener datos específicos del item si existen
      const item = items?.[i];

      const [resource] = await db
        .insert(resources)
        .values({
          id: randomUUID(),
          institutionId,
          internalId,
          name: resourceDto.name,
          categoryId: resourceDto.categoryId || null,
          templateId: resourceDto.templateId || null,
          brand: resourceDto.brand || null,
          model: resourceDto.model || null,
          serialNumber: item?.serialNumber || null,
          status: item?.status || resourceDto.status || 'disponible',
          condition: item?.condition || resourceDto.condition || 'bueno',
          stock: 1, // Individual stock for batch items
          notes: resourceDto.notes || null,
          attributes: {},
          maintenanceProgress: 0,
          maintenanceState: null,
        })
        .returning();

      createdResources.push(resource);
    }

    return successResponse(createdResources, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
