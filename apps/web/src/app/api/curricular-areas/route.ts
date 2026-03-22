import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createCurricularAreaSchema, curricularAreaQuerySchema } from '@/lib/validations/schemas/curricular-areas';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { curricularAreas } from '@/lib/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const query = validateQuery(curricularAreaQuerySchema, request.nextUrl.searchParams);

    const conditions = [eq(curricularAreas.institutionId, institutionId)];

    // Filter by active status
    if (query.active === 'true') {
      conditions.push(eq(curricularAreas.active, true));
    }

    // Filter by level (check if level is in the levels array)
    if (query.level) {
      conditions.push(
        sql`${curricularAreas.levels}::jsonb @> ${JSON.stringify([query.level])}::jsonb`
      );
    }

    const results = await db.query.curricularAreas.findMany({
      where: and(...conditions),
      orderBy: [asc(curricularAreas.name)],
    });

    return successResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createCurricularAreaSchema, body);

    const [area] = await db
      .insert(curricularAreas)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        levels: data.levels || null,
        isStandard: data.isStandard ?? false,
        active: true,
      })
      .returning();

    return successResponse(area, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
