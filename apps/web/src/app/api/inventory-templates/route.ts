import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { resources, categories, resourceTemplates } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface InventoryTemplateAggregation {
    templateId: string;
    templateName: string;
    templateIcon: string | null;
    categoryId: string;
    categoryName: string;
    categoryIcon: string | null;
    categoryColor: string | null;
    totalStock: number;
    available: number;
    borrowed: number;
    maintenance: number;
    retired: number;
}

export async function GET(request: NextRequest) {
    const start = Date.now();
    try {
        await requireAuth(request);
        const institutionId = await getInstitutionId(request);

        const aggregations = await db
            .select({
                templateId: resourceTemplates.id,
                templateName: resourceTemplates.name,
                templateIcon: resourceTemplates.icon,
                categoryId: categories.id,
                categoryName: categories.name,
                categoryIcon: categories.icon,
                categoryColor: categories.color,
                totalStock: sql<number>`count(${resources.id})::int`,
                available: sql<number>`sum(case when ${resources.status} = 'disponible' then 1 else 0 end)::int`,
                borrowed: sql<number>`sum(case when ${resources.status} = 'prestado' then 1 else 0 end)::int`,
                maintenance: sql<number>`sum(case when ${resources.status} = 'mantenimiento' then 1 else 0 end)::int`,
                retired: sql<number>`sum(case when ${resources.status} = 'baja' then 1 else 0 end)::int`,
            })
            .from(resourceTemplates)
            .innerJoin(categories, eq(resourceTemplates.categoryId, categories.id))
            .leftJoin(resources, eq(resourceTemplates.id, resources.templateId))
            .where(
                and(
                    eq(resourceTemplates.institutionId, institutionId)
                )
            )
            .groupBy(
                resourceTemplates.id,
                resourceTemplates.name,
                resourceTemplates.icon,
                categories.id,
                categories.name,
                categories.icon,
                categories.color
            )
            .orderBy(categories.name, resourceTemplates.name);

        console.log(`[TIMING] inventory-templates GET: ${Date.now() - start}ms`);
        return successResponse(aggregations);
    } catch (error) {
        console.log(`[TIMING] inventory-templates GET ERROR: ${Date.now() - start}ms`);
        return errorResponse(error);
    }
}
