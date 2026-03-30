import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { grades, sections, curricularAreas, pedagogicalHours } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);
        const institutionId = await getInstitutionId(request);

        // Fetch all config data in parallel
        const [
            gradesResult,
            sectionsResult,
            areasResult,
            hoursResult
        ] = await Promise.all([
            // 1. Grades
            db.query.grades.findMany({
                where: eq(grades.institutionId, institutionId),
                orderBy: [asc(grades.level), asc(grades.sortOrder)],
            }),
            // 2. All Sections for this institution
            db.query.sections.findMany({
                where: eq(sections.institutionId, institutionId),
                orderBy: [asc(sections.name)],
            }),
            // 3. Curricular Areas (active only)
            db.query.curricularAreas.findMany({
                where: and(
                    eq(curricularAreas.institutionId, institutionId),
                    eq(curricularAreas.active, true)
                ),
                orderBy: [asc(curricularAreas.name)],
            }),
            // 4. Pedagogical Hours
            db.query.pedagogicalHours.findMany({
                where: and(
                    eq(pedagogicalHours.institutionId, institutionId),
                    eq(pedagogicalHours.active, true)
                ),
                orderBy: [asc(pedagogicalHours.sortOrder)],
            })
        ]);

        return successResponse({
            grades: gradesResult,
            sections: sectionsResult,
            curricularAreas: areasResult,
            pedagogicalHours: hoursResult,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
