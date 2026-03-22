import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { staff, resources, loans, meetings } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

// GET /api/dashboard/institution-stats - Institution-level stats
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const [
      totalStaff,
      totalResources,
      availableResources,
      activeLoans,
      overdueLoans,
      totalMeetings,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(staff)
        .where(and(eq(staff.institutionId, institutionId), eq(staff.status, 'active'))),
      db
        .select({ count: count() })
        .from(resources)
        .where(eq(resources.institutionId, institutionId)),
      db
        .select({ count: count() })
        .from(resources)
        .where(and(eq(resources.institutionId, institutionId), eq(resources.status, 'disponible'))),
      db
        .select({ count: count() })
        .from(loans)
        .where(and(eq(loans.institutionId, institutionId), eq(loans.status, 'active'))),
      db
        .select({ count: count() })
        .from(loans)
        .where(and(eq(loans.institutionId, institutionId), eq(loans.status, 'overdue'))),
      db
        .select({ count: count() })
        .from(meetings)
        .where(eq(meetings.institutionId, institutionId)),
    ]);

    return successResponse({
      institution: {
        totalStaff: totalStaff[0].count,
        totalResources: totalResources[0].count,
        availableResources: availableResources[0].count,
        activeLoans: activeLoans[0].count,
        overdueLoans: overdueLoans[0].count,
        totalMeetings: totalMeetings[0].count,
      },
    });
  } catch (error) {
    console.log(`[TIMING] institution-stats: ${Date.now() - start}ms`);
    return errorResponse(error);
  } finally {
    console.log(`[TIMING] institution-stats: ${Date.now() - start}ms`);
  }
}
