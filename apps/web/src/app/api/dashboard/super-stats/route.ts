import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { institutions, users, resources, loans } from '@/lib/db/schema';
import { eq, ne, count, sql } from 'drizzle-orm';

// GET /api/dashboard/super-stats - Platform-wide stats for SuperAdmin
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const [
      totalInstitutions,
      totalUsers,
      totalResources,
      totalLoans,
      activeLoans,
      overdueLoans,
    ] = await Promise.all([
      db.select({ count: count() }).from(institutions),
      db.select({ count: count() }).from(users).where(ne(users.isSuperAdmin, true)),
      db.select({ count: count() }).from(resources),
      db.select({ count: count() }).from(loans),
      db.select({ count: count() }).from(loans).where(eq(loans.status, 'active')),
      db.select({ count: count() }).from(loans).where(eq(loans.status, 'overdue')),
    ]);

    // Recent institutions (last 5)
    const recentInstitutions = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        nivel: institutions.nivel,
        plan: institutions.plan,
        createdAt: institutions.createdAt,
      })
      .from(institutions)
      .orderBy(sql`${institutions.createdAt} DESC`)
      .limit(5);

    return successResponse({
      platform: {
        totalInstitutions: totalInstitutions[0].count,
        totalUsers: totalUsers[0].count,
        totalResources: totalResources[0].count,
        totalLoans: totalLoans[0].count,
        activeLoans: activeLoans[0].count,
        overdueLoans: overdueLoans[0].count,
      },
      recentInstitutions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
