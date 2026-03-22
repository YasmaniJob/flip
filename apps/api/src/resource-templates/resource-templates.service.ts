import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, asc, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateResourceTemplateDto } from './dto/create-resource-template.dto';
import { UpdateResourceTemplateDto } from './dto/update-resource-template.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class ResourceTemplatesService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async findAll(institutionId: string, pagination: PaginationDto, categoryId?: string): Promise<PaginatedResult<typeof schema.resourceTemplates.$inferSelect>> {
        const conditions = [
            eq(schema.resourceTemplates.institutionId, institutionId),
        ];

        if (categoryId) {
            conditions.push(eq(schema.resourceTemplates.categoryId, categoryId));
        }

        const whereCondition = and(...conditions);
        const { limit = 10, page = 1 } = pagination;
        const offset = (page - 1) * limit;

        const [results, totalResult] = await Promise.all([
            this.db
                .select()
                .from(schema.resourceTemplates)
                .where(whereCondition)
                .limit(limit)
                .offset(offset)
                .orderBy(asc(schema.resourceTemplates.sortOrder), asc(schema.resourceTemplates.name)),

            this.db
                .select({ count: sql<number>`count(*)` })
                .from(schema.resourceTemplates)
                .where(whereCondition)
        ]);

        const total = Number(totalResult[0]?.count || 0);

        return {
            data: results,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async create(institutionId: string, dto: CreateResourceTemplateDto) {
        const template = await this.db
            .insert(schema.resourceTemplates)
            .values({
                id: randomUUID(),
                institutionId,
                categoryId: dto.categoryId || null,
                name: dto.name,
                icon: dto.icon || null,
                defaultBrand: dto.defaultBrand || null,
                defaultModel: dto.defaultModel || null,
                isDefault: dto.isDefault || false,
                sortOrder: dto.sortOrder || 0,
            })
            .returning();

        return template[0];
    }

    async update(institutionId: string, id: string, dto: UpdateResourceTemplateDto) {
        const template = await this.db
            .update(schema.resourceTemplates)
            .set({
                categoryId: dto.categoryId,
                name: dto.name,
                icon: dto.icon,
                defaultBrand: dto.defaultBrand,
                defaultModel: dto.defaultModel,
                isDefault: dto.isDefault,
                sortOrder: dto.sortOrder,
            })
            .where(
                and(
                    eq(schema.resourceTemplates.id, id),
                    eq(schema.resourceTemplates.institutionId, institutionId),
                ),
            )
            .returning();

        if (!template.length) {
            throw new NotFoundException('Template no encontrado');
        }

        return template[0];
    }

    async remove(institutionId: string, id: string) {
        const template = await this.db
            .delete(schema.resourceTemplates)
            .where(
                and(
                    eq(schema.resourceTemplates.id, id),
                    eq(schema.resourceTemplates.institutionId, institutionId),
                ),
            )
            .returning();

        if (!template.length) {
            throw new NotFoundException('Template no encontrado');
        }

        return template[0];
    }
}
