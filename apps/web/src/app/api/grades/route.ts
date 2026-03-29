import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createGradeSchema, gradeQuerySchema } from '@/lib/validations/schemas/grades';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { grades } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const query = validateQuery(gradeQuerySchema, request.nextUrl.searchParams);

    const conditions = [eq(grades.institutionId, institutionId)];
    if (query.level) {
      conditions.push(eq(grades.level, query.level));
    }

    const results = await db.query.grades.findMany({
      where: and(...conditions),
      columns: {
        id: true,
        name: true,
        level: true,
        sortOrder: true,
      },
      orderBy: [asc(grades.level), asc(grades.sortOrder)],
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
    const data = validateBody(createGradeSchema, body);

    const [grade] = await db
      .insert(grades)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        level: data.level,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return successResponse(grade, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
