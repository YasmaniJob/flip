import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { sections } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

const bulkCreateSectionSchema = z.object({
  sections: z.array(z.object({
    name: z.string().min(1),
    gradeId: z.string().min(1),
  }))
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(bulkCreateSectionSchema, body);

    if (data.sections.length === 0) {
        return successResponse([]);
    }

    const values = data.sections.map((s) => ({
      id: randomUUID(),
      institutionId,
      name: s.name,
      gradeId: s.gradeId,
    }));

    const created = await db.insert(sections).values(values).returning();

    return successResponse(created, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
