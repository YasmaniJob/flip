import { db } from '@/lib/db';
import { resources, categories, categorySequences } from '@/lib/db/schema';
import { eq, and, sql, like, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { CreateResourceInput, ResourcesQueryInput } from '@/lib/validations/schemas/resources';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PaginatedResources = {
  data: typeof resources.$inferSelect[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

// ─── Repository ──────────────────────────────────────────────────────────────

export const ResourceRepository = {
  /**
   * Helper: Get next sequence number (atomic upsert) for a category prefix
   */
  async getNextSequence(institutionId: string, prefix: string): Promise<number> {
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
  },

  /**
   * Find a category by ID
   */
  async findCategoryById(categoryId: string) {
    return db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });
  },

  /**
   * List resources with pagination and filters
   */
  async findMany(
    institutionId: string,
    query: ResourcesQueryInput
  ): Promise<PaginatedResources> {
    const { search, categoryId, status, condition } = query;
    const limit = Math.min(parseInt((query as any).limit || '20'), 100);
    const offset = parseInt((query as any).offset || '0');

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

    // Parallel queries for pagination
    const [results, totalResult] = await Promise.all([
      db.query.resources.findMany({
        where: whereCondition,
        limit,
        offset,
        orderBy: (r, { asc }) => [asc(r.internalId), asc(r.createdAt)],
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(resources).where(whereCondition)
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: results,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Create a new resource
   */
  async create(
    institutionId: string,
    internalId: string,
    data: CreateResourceInput
  ) {
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

    return resource;
  }
};
