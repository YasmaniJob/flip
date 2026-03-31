import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateQuery } from '@/lib/validations/helpers';
import { recurrentStaffQuerySchema } from '@/lib/validations/schemas/staff';
import { db } from '@/lib/db';
import { staff, loans } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const getCachedRecurrentStaff = unstable_cache(
  async (institutionId: string, limit: number) => {
    const recurrentStaff = await db
      .select({
        staff: staff,
        loanCount: sql<number>`count(${loans.id})`.mapWith(Number),
      })
      .from(staff)
      .leftJoin(loans, eq(loans.staffId, staff.id))
      .where(and(eq(staff.institutionId, institutionId), eq(staff.status, 'active')))
      .groupBy(staff.id)
      .orderBy(desc(sql`count(${loans.id})`))
      .limit(limit);

    return recurrentStaff.map((r) => r.staff);
  },
  ['recurrent-staff-cache'],
  { revalidate: 600, tags: ['staff'] } // 10 minutes cache
);

// GET /api/staff/recurrent - Get most recurrent staff (by loan count)
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(recurrentStaffQuerySchema, searchParams);

    const { limit } = query;

    const results = await getCachedRecurrentStaff(institutionId, limit || 6);

    return successResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
}
