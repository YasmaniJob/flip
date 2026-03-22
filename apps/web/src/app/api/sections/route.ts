import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createSectionSchema, sectionQuerySchema } from '@/lib/validations/schemas/sections';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { sections } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const query = validateQuery(sectionQuerySchema, request.nextUrl.searchParams);

    const conditions = [eq(sections.institutionId, institutionId)];
    if (query.gradeId) {
      conditions.push(eq(sections.gradeId, query.gradeId));
    }

    const results = await db.query.sections.findMany({
      where: and(...conditions),
      orderBy: [asc(sections.name)],
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
    const data = validateBody(createSectionSchema, body);

    const [section] = await db
      .insert(sections)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        gradeId: data.gradeId,
        areaId: data.areaId || null,
        studentCount: data.studentCount || null,
      })
      .returning();

    return successResponse(section, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
