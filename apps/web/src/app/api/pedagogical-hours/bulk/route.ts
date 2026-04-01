import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { bulkCreatePedagogicalHourSchema } from '@/lib/validations/schemas/pedagogical-hours';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { pedagogicalHours } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(bulkCreatePedagogicalHourSchema, body);

    const created = await db.insert(pedagogicalHours)
      .values(data.map(h => ({
        id: randomUUID(),
        institutionId,
        name: h.name,
        startTime: h.startTime,
        endTime: h.endTime,
        sortOrder: h.sortOrder ?? 0,
        isBreak: h.isBreak ?? false,
        active: true,
      })))
      .returning();

    revalidateTag('config-loadout');

    return successResponse(created, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
