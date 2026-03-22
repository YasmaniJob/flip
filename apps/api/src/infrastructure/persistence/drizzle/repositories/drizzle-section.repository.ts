import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { ISectionRepository } from '../../../../core/ports/outbound/section.repository';
import { Section } from '../../../../core/domain/entities/section.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleSectionRepository implements ISectionRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.sections.$inferSelect): Section {
        return new Section(
            row.id,
            InstitutionId.create(row.institutionId),
            row.name,
            row.gradeId,
            row.areaId,
            row.studentCount,
            row.createdAt ?? undefined,
        );
    }

    async save(section: Section): Promise<Section> {
        await this.db.insert(schema.sections).values({
            id: section.id,
            institutionId: section.institutionId.value,
            name: section.name,
            gradeId: section.gradeId,
            areaId: section.areaId,
            studentCount: section.studentCount,
        });
        return section;
    }

    async update(section: Section): Promise<Section> {
        await this.db.update(schema.sections)
            .set({
                name: section.name,
                gradeId: section.gradeId,
                areaId: section.areaId,
                studentCount: section.studentCount,
            })
            .where(eq(schema.sections.id, section.id));
        return section;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<Section | null> {
        const result = await this.db.query.sections.findFirst({
            where: (sections, { eq, and }) => and(
                eq(sections.id, id),
                eq(sections.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findAll(institutionId: InstitutionId): Promise<Section[]> {
        const result = await this.db.query.sections.findMany({
            where: (sections, { eq }) => eq(sections.institutionId, institutionId.value),
        });
        return result.map(this.toDomain.bind(this));
    }

    async findByGrade(institutionId: InstitutionId, gradeId: string): Promise<Section[]> {
        const result = await this.db.query.sections.findMany({
            where: (sections, { eq, and }) => and(
                eq(sections.institutionId, institutionId.value),
                eq(sections.gradeId, gradeId)
            ),
        });
        return result.map(this.toDomain.bind(this));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        // Set sectionId to NULL in reservations that use this section
        await this.db.update(schema.classroomReservations)
            .set({ sectionId: null })
            .where(
                and(
                    eq(schema.classroomReservations.sectionId, id),
                    eq(schema.classroomReservations.institutionId, institutionId.value)
                )
            );

        // Now delete the section
        const result = await this.db.delete(schema.sections)
            .where(
                and(
                    eq(schema.sections.id, id),
                    eq(schema.sections.institutionId, institutionId.value)
                )
            )
            .returning();
        return result.length > 0;
    }
}
