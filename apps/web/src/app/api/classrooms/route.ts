import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createClassroomSchema } from '@/lib/validations/schemas/classrooms';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { classrooms } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const results = await db.query.classrooms.findMany({
      where: eq(classrooms.institutionId, institutionId),
      orderBy: [asc(classrooms.sortOrder), asc(classrooms.name)],
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
    const data = validateBody(createClassroomSchema, body);

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await db
        .update(classrooms)
        .set({ isPrimary: false })
        .where(eq(classrooms.institutionId, institutionId));
    }

    const [classroom] = await db
      .insert(classrooms)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        code: data.code || null,
        isPrimary: data.isPrimary ?? false,
        sortOrder: data.sortOrder ?? 0,
        active: true,
      })
      .returning();

    return successResponse(classroom, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
