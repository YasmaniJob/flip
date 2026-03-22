import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { seedStandardAreasSchema } from '@/lib/validations/schemas/curricular-areas';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { curricularAreas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    // Get existing areas to prevent duplicates
    const existingAreas = await db.query.curricularAreas.findMany({
      where: eq(curricularAreas.institutionId, institutionId),
    });

    const existingNames = new Set(
      existingAreas.map((a) => a.name.toLowerCase().trim())
    );

    // Filter areas to create
    const areasToCreate = STANDARD_AREAS.filter((std) => {
      // If specific selection is provided, allow only those
      if (data.selectedAreas && data.selectedAreas.length > 0) {
        if (!data.selectedAreas.includes(std.name)) return false;
      }
      // Exclude if already exists
      return !existingNames.has(std.name.toLowerCase().trim());
    });

    if (areasToCreate.length === 0) {
      return successResponse({
        message: 'No hay áreas nuevas para importar',
        count: 0,
      });
    }

    // Batch insert
    const created = await db
      .insert(curricularAreas)
      .values(
        areasToCreate.map((a) => ({
          id: randomUUID(),
          institutionId,
          name: a.name,
          levels: [...a.levels],
          isStandard: true,
          active: true,
        }))
      )
      .returning();

    return successResponse({
      message: 'Áreas importadas correctamente',
      count: created.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
