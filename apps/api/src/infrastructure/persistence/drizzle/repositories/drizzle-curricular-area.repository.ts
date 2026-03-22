import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { ICurricularAreaRepository } from '../../../../core/ports/outbound/curricular-area.repository';
import { CurricularArea } from '../../../../core/domain/entities/curricular-area.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleCurricularAreaRepository implements ICurricularAreaRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.curricularAreas.$inferSelect): CurricularArea {
        return new CurricularArea(
            row.id,
            InstitutionId.create(row.institutionId),
            row.name,
            row.levels as ('primaria' | 'secundaria')[] | null,
            row.isStandard ?? false,
            row.active ?? true,
            row.createdAt ?? undefined,
        );
    }

    async save(area: CurricularArea): Promise<CurricularArea> {
        await this.db.insert(schema.curricularAreas).values({
            id: area.id,
            institutionId: area.institutionId.value,
            name: area.name,
            levels: area.levels,
            isStandard: area.isStandard,
            active: area.active,
        });
        return area;
    }

    async update(area: CurricularArea): Promise<CurricularArea> {
        await this.db.update(schema.curricularAreas)
            .set({
                name: area.name,
                levels: area.levels,
                active: area.active,
            })
            .where(eq(schema.curricularAreas.id, area.id));
        return area;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<CurricularArea | null> {
        const result = await this.db.query.curricularAreas.findFirst({
            where: (areas, { eq, and }) => and(
                eq(areas.id, id),
                eq(areas.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findAll(institutionId: InstitutionId): Promise<CurricularArea[]> {
        const result = await this.db.query.curricularAreas.findMany({
            where: (areas, { eq }) => eq(areas.institutionId, institutionId.value),
        });
        return result.map(this.toDomain.bind(this));
    }

    async findByLevel(institutionId: InstitutionId, level: 'primaria' | 'secundaria'): Promise<CurricularArea[]> {
        const result = await this.db.query.curricularAreas.findMany({
            where: (areas, { eq }) => eq(areas.institutionId, institutionId.value),
        });
        // Filter by level in memory since levels is a JSON array
        return result
            .filter(row => {
                const levels = row.levels as ('primaria' | 'secundaria')[] | null;
                return levels?.includes(level) ?? false;
            })
            .map(this.toDomain.bind(this));
    }

    async findActive(institutionId: InstitutionId): Promise<CurricularArea[]> {
        const result = await this.db.query.curricularAreas.findMany({
            where: (areas, { eq, and }) => and(
                eq(areas.institutionId, institutionId.value),
                eq(areas.active, true)
            ),
        });
        return result.map(this.toDomain.bind(this));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        // Set curricularAreaId to NULL in reservations that use this area
        await this.db.update(schema.classroomReservations)
            .set({ curricularAreaId: null })
            .where(
                and(
                    eq(schema.classroomReservations.curricularAreaId, id),
                    eq(schema.classroomReservations.institutionId, institutionId.value)
                )
            );

        // Set areaId to NULL in sections that use this area
        await this.db.update(schema.sections)
            .set({ areaId: null })
            .where(
                and(
                    eq(schema.sections.areaId, id),
                    eq(schema.sections.institutionId, institutionId.value)
                )
            );

        // Now delete the curricular area
        const result = await this.db.delete(schema.curricularAreas)
            .where(
                and(
                    eq(schema.curricularAreas.id, id),
                    eq(schema.curricularAreas.institutionId, institutionId.value)
                )
            )
            .returning();
        return result.length > 0;
    }
}
