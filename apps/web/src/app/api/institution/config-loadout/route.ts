import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { grades, sections, curricularAreas, pedagogicalHours, classrooms, institutions } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const getCachedConfigLoadout = unstable_cache(
    async (institutionId: string) => {
        const [
            gradesResult,
            sectionsResult,
            areasResult,
            hoursResult,
            classroomsResult,
            institutionResult
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
            }),
            // 5. Classrooms
            db.query.classrooms.findMany({
                where: and(
                    eq(classrooms.institutionId, institutionId),
                    eq(classrooms.active, true)
                ),
                orderBy: [asc(classrooms.sortOrder), asc(classrooms.name)],
            }),
            // 6. Institution (for settings/defaults)
            db.query.institutions.findFirst({
                where: eq(institutions.id, institutionId),
            })
        ]);

        return {
            grades: gradesResult,
            sections: sectionsResult,
            curricularAreas: areasResult,
            pedagogicalHours: hoursResult,
            classrooms: classroomsResult,
            defaults: institutionResult?.settings || {},
        };
    },
    ['config-loadout-cache-v2'], // Changing key name to bust any bad caches
    { revalidate: 300, tags: ['config-loadout'] } // 5 minutes cache invalidation
);

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);
        const institutionId = await getInstitutionId(request);

        // Fetch all config data from cache
        const configData = await getCachedConfigLoadout(institutionId);

        return successResponse(configData);
    } catch (error) {
        return errorResponse(error);
    }
}
