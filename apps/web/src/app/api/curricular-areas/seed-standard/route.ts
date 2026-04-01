import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { seedStandardAreasSchema } from '@/lib/validations/schemas/curricular-areas';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { curricularAreas, institutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidateTag } from 'next/cache';

const STANDARD_AREAS = [
  { name: 'Matemática', levels: ['primaria', 'secundaria'] as const },
  { name: 'Comunicación', levels: ['primaria', 'secundaria'] as const },
  { name: 'Ciencia y Tecnología', levels: ['primaria', 'secundaria'] as const },
  { name: 'Personal Social', levels: ['primaria'] as const },
  { name: 'Desarrollo Personal, Ciudadanía y Cívica', levels: ['secundaria'] as const },
  { name: 'Ciencias Sociales', levels: ['secundaria'] as const },
  { name: 'Arte y Cultura', levels: ['primaria', 'secundaria'] as const },
  { name: 'Educación Física', levels: ['primaria', 'secundaria'] as const },
  { name: 'Educación Religiosa', levels: ['primaria', 'secundaria'] as const },
  { name: 'Inglés', levels: ['primaria', 'secundaria'] as const },
  { name: 'Educación para el Trabajo', levels: ['secundaria'] as const },
  { name: 'Tutoría', levels: ['primaria', 'secundaria'] as const },
];

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(seedStandardAreasSchema, body);

    // Get institution to know its level
    const institution = await db.query.institutions.findFirst({
        where: eq(institutions.id, institutionId),
    });

    const institutionLevel = institution?.nivel?.toLowerCase() || 'ambos';
    const supportedLevels = institutionLevel === 'ambos' 
        ? ['primaria', 'secundaria'] 
        : [institutionLevel];

    // Get existing areas for comparison
    const existingAreas = await db.query.curricularAreas.findMany({
      where: eq(curricularAreas.institutionId, institutionId),
    });

    // We'll perform all operations inside a transaction for atomicity
    const results = await db.transaction(async (tx) => {
        const areasToCreate: typeof STANDARD_AREAS = [];
        const areasToUpdate: string[] = []; // List of IDs touched
        let skipped = 0;

        for (const std of STANDARD_AREAS) {
            // Apply selection filter if present
            if (data.selectedAreas && data.selectedAreas.length > 0) {
                if (!data.selectedAreas.includes(std.name)) continue;
            }

            // LEVEL ALIGNMENT: Find intersection between CNEB standard and school scope
            const intersection = std.levels.filter(l => (supportedLevels as string[]).includes(l));
            
            // If the standard area doesn't belong to the school's levels, we don't import it
            if (intersection.length === 0) {
                skipped++;
                continue;
            }

            const existing = existingAreas.find(ea => ea.name.toLowerCase().trim() === std.name.toLowerCase().trim());
            const targetLevels = intersection;

            if (existing) {
                const hasCorrectLevels = existing.levels && 
                                        Array.isArray(existing.levels) && 
                                        targetLevels.every(l => (existing.levels as string[]).includes(l));
                
                // If it exists but was inactive or had wrong levels, update it
                if (!hasCorrectLevels || !existing.active) {
                    await tx.update(curricularAreas)
                        .set({ levels: targetLevels, active: true })
                        .where(eq(curricularAreas.id, existing.id));
                    areasToUpdate.push(existing.id);
                }
            } else {
                areasToCreate.push(std);
            }
        }

        // CLEANUP: Deactivate areas that no longer belong to the institution level scope
        // This ensures the catalog stays clean if they switched levels or had mismatch data
        const standardAreasInDb = existingAreas.filter(ea => ea.isStandard);
        for (const area of standardAreasInDb) {
            const stdInfo = STANDARD_AREAS.find(s => s.name.toLowerCase() === area.name.toLowerCase());
            if (stdInfo) {
                const hasScopeMatch = stdInfo.levels.some(l => (supportedLevels as string[]).includes(l));
                if (!hasScopeMatch && area.active) {
                    await tx.update(curricularAreas)
                        .set({ active: false })
                        .where(eq(curricularAreas.id, area.id));
                    areasToUpdate.push(area.id);
                }
            }
        }

        // Batch Create new ones
        let createdCount = 0;
        if (areasToCreate.length > 0) {
            const created = await tx.insert(curricularAreas)
                .values(areasToCreate.map(a => {
                    const intersection = a.levels.filter(l => (supportedLevels as string[]).includes(l));
                    return {
                        id: randomUUID(),
                        institutionId,
                        name: a.name,
                        levels: intersection,
                        isStandard: true,
                        active: true,
                    };
                }))
                .returning();
            createdCount = created.length;
        }

        return { created: createdCount, updated: areasToUpdate.length };
    });

    // Invalidate Cache after atomic operations
    revalidateTag('config-loadout');

    return successResponse({
      message: 'Áreas procesadas con éxito',
      count: results.created + results.updated,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

