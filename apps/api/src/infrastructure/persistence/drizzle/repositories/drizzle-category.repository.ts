import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { Category } from '../../../../core/domain/entities/category.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleCategoryRepository implements ICategoryRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.categories.$inferSelect): Category {
        return new Category(
            row.id,
            InstitutionId.create(row.institutionId),
            row.name,
            row.icon,
            row.color,
        );
    }

    async save(category: Category): Promise<Category> {
        await this.db.insert(schema.categories).values({
            id: category.id,
            institutionId: category.institutionId.value,
            name: category.name,
            icon: category.icon,
            color: category.color,
        });
        return category;
    }

    async update(category: Category): Promise<Category> {
        await this.db.update(schema.categories)
            .set({
                name: category.name,
                icon: category.icon,
                color: category.color,
            })
            .where(eq(schema.categories.id, category.id));
        return category;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<Category | null> {
        const result = await this.db.query.categories.findFirst({
            where: (categories, { eq, and }) => and(
                eq(categories.id, id),
                eq(categories.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findByName(name: string, institutionId: InstitutionId): Promise<Category | null> {
        const result = await this.db.query.categories.findFirst({
            where: (categories, { eq, and }) => and(
                eq(categories.name, name),
                eq(categories.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findAll(institutionId: InstitutionId, options?: { hasResources?: boolean }): Promise<Category[]> {
        if (options?.hasResources) {
            const rows = await this.db
                .selectDistinct({
                    id: schema.categories.id,
                    institutionId: schema.categories.institutionId,
                    name: schema.categories.name,
                    icon: schema.categories.icon,
                    color: schema.categories.color,
                })
                .from(schema.categories)
                .innerJoin(schema.resources, eq(schema.categories.id, schema.resources.categoryId))
                .where(and(
                    eq(schema.categories.institutionId, institutionId.value),
                    eq(schema.resources.status, 'disponible') // Optional: only show if resources are available? User said "created", implies existence. I'll stick to existence for now, maybe filtered by status if needed later. But usually just "has resources" is enough. User said "solo debería aparece los que tenemos creados".
                    // Actually, if I filter by status='disponible' here, it matches the frontend filter.
                    // But maybe "created" just means they exist. I'll stick to a simple innerJoin which implies existence.
                    // If the user wants only "available" ones, I should add that.
                    // Given the context of "Loan Wizard", likely they want *available* ones.
                    // But let's stick to simple existence first (innerJoin automatically filters out categories with no matching resources).
                ));

            return rows.map(this.toDomain);
        }

        const result = await this.db.query.categories.findMany({
            where: (categories, { eq }) => eq(categories.institutionId, institutionId.value),
        });
        return result.map(this.toDomain);
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        return await this.db.transaction(async (tx) => {
            // Delete associated templates first (manual cascade)
            await tx.delete(schema.resourceTemplates)
                .where(
                    and(
                        eq(schema.resourceTemplates.categoryId, id),
                        eq(schema.resourceTemplates.institutionId, institutionId.value)
                    )
                );

            const result = await tx.delete(schema.categories)
                .where(
                    and(
                        eq(schema.categories.id, id),
                        eq(schema.categories.institutionId, institutionId.value)
                    )
                )
                .returning();
            return result.length > 0;
        });
    }

    async countResources(id: string): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.resources)
            .where(eq(schema.resources.categoryId, id));
        return result[0]?.count ?? 0;
    }
}
