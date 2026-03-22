import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createPedagogicalHourSchema } from '@/lib/validations/schemas/pedagogical-hours';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { pedagogicalHours } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const results = await db.query.pedagogicalHours.findMany({
      where: eq(pedagogicalHours.institutionId, institutionId),
      orderBy: [asc(pedagogicalHours.sortOrder)],
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
    const data = validateBody(createPedagogicalHourSchema, body);

    const [hour] = await db
      .insert(pedagogicalHours)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        sortOrder: data.sortOrder ?? 0,
        isBreak: data.isBreak ?? false,
        active: true,
      })
      .returning();

    return successResponse(hour, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
