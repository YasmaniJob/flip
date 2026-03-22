import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { IGradeRepository } from '../../../../core/ports/outbound/grade.repository';
import { Grade } from '../../../../core/domain/entities/grade.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleGradeRepository implements IGradeRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.grades.$inferSelect): Grade {
        return new Grade(
            row.id,
            InstitutionId.create(row.institutionId),
            row.name,
            row.level as 'primaria' | 'secundaria',
            row.sortOrder ?? 0,
            row.createdAt ?? undefined,
        );
    }

    async save(grade: Grade): Promise<Grade> {
        await this.db.insert(schema.grades).values({
            id: grade.id,
            institutionId: grade.institutionId.value,
            name: grade.name,
            level: grade.level,
            sortOrder: grade.sortOrder,
        });
        return grade;
    }

    async update(grade: Grade): Promise<Grade> {
        await this.db.update(schema.grades)
            .set({
                name: grade.name,
                level: grade.level,
                sortOrder: grade.sortOrder,
            })
            .where(eq(schema.grades.id, grade.id));
        return grade;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<Grade | null> {
        const result = await this.db.query.grades.findFirst({
            where: (grades, { eq, and }) => and(
                eq(grades.id, id),
                eq(grades.institutionId, institutionId.value)
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findAll(institutionId: InstitutionId): Promise<Grade[]> {
        const result = await this.db.query.grades.findMany({
            where: (grades, { eq }) => eq(grades.institutionId, institutionId.value),
            orderBy: (grades, { asc }) => [asc(grades.level), asc(grades.sortOrder)],
        });
        return result.map(this.toDomain.bind(this));
    }

    async findByLevel(institutionId: InstitutionId, level: 'primaria' | 'secundaria'): Promise<Grade[]> {
        const result = await this.db.query.grades.findMany({
            where: (grades, { eq, and }) => and(
                eq(grades.institutionId, institutionId.value),
                eq(grades.level, level)
            ),
            orderBy: (grades, { asc }) => [asc(grades.sortOrder)],
        });
        return result.map(this.toDomain.bind(this));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        // Set gradeId to NULL in reservations that use this grade
        await this.db.update(schema.classroomReservations)
            .set({ gradeId: null })
            .where(
                and(
                    eq(schema.classroomReservations.gradeId, id),
                    eq(schema.classroomReservations.institutionId, institutionId.value)
                )
            );

        // Now delete the grade
        const result = await this.db.delete(schema.grades)
            .where(
                and(
                    eq(schema.grades.id, id),
                    eq(schema.grades.institutionId, institutionId.value)
                )
            )
            .returning();
        return result.length > 0;
    }

    async countSections(id: string): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.sections)
            .where(eq(schema.sections.gradeId, id));
        return result[0]?.count ?? 0;
    }
}
