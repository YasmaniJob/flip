import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { IPedagogicalHourRepository } from '../../../../core/ports/outbound/pedagogical-hour.repository';
import { PedagogicalHour } from '../../../../core/domain/entities/pedagogical-hour.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzlePedagogicalHourRepository implements IPedagogicalHourRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.pedagogicalHours.$inferSelect): PedagogicalHour {
        return new PedagogicalHour(
            row.id,
            InstitutionId.create(row.institutionId),
            row.name,
            row.startTime,
            row.endTime,
            row.sortOrder ?? 0,
            row.isBreak ?? false,
            row.active ?? true,
            row.createdAt ?? undefined,
        );
    }

    async save(pedagogicalHour: PedagogicalHour): Promise<PedagogicalHour> {
        await this.db.insert(schema.pedagogicalHours).values({
            id: pedagogicalHour.id,
            institutionId: pedagogicalHour.institutionId.value,
            name: pedagogicalHour.name,
            startTime: pedagogicalHour.startTime,
            endTime: pedagogicalHour.endTime,
            sortOrder: pedagogicalHour.sortOrder,
            isBreak: pedagogicalHour.isBreak,
            active: pedagogicalHour.active,
        });
        return pedagogicalHour;
    }

    async update(pedagogicalHour: PedagogicalHour): Promise<PedagogicalHour> {
        await this.db.update(schema.pedagogicalHours)
            .set({
                name: pedagogicalHour.name,
                startTime: pedagogicalHour.startTime,
                endTime: pedagogicalHour.endTime,
                sortOrder: pedagogicalHour.sortOrder,
                isBreak: pedagogicalHour.isBreak,
                active: pedagogicalHour.active,
            })
            .where(eq(schema.pedagogicalHours.id, pedagogicalHour.id));
        return pedagogicalHour;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<PedagogicalHour | null> {
        const result = await this.db.query.pedagogicalHours.findFirst({
            where: (hours, { eq, and }) => and(
                eq(hours.id, id),
                eq(hours.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findAll(institutionId: InstitutionId): Promise<PedagogicalHour[]> {
        const result = await this.db.query.pedagogicalHours.findMany({
            where: (hours, { eq }) => eq(hours.institutionId, institutionId.value),
            orderBy: (hours, { asc }) => [asc(hours.sortOrder)],
        });
        return result.map(this.toDomain.bind(this));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        const result = await this.db.delete(schema.pedagogicalHours)
            .where(
                and(
                    eq(schema.pedagogicalHours.id, id),
                    eq(schema.pedagogicalHours.institutionId, institutionId.value)
                )
            )
            .returning();
        return result.length > 0;
    }
}
