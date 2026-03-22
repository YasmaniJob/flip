import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { errorResponse, paginatedResponse } from '@/lib/utils/response';
import { validateQuery } from '@/lib/validations/helpers';
import { usersQuerySchema } from '@/lib/validations/schemas/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

// GET /api/users - List users by institution
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(usersQuerySchema, searchParams);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(eq(users.institutionId, institutionId))
        .limit(limit)
        .offset(offset)
        .orderBy(asc(users.name)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.institutionId, institutionId)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return paginatedResponse(results, {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
