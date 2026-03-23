import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { institutions, users } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';

// GET /api/admin/subscriptions - List all institutions with subscription info
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Get all institutions with user count
    const institutionsWithUsers = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        codigoModular: institutions.codigoModular,
        subscriptionStatus: institutions.subscriptionStatus,
        subscriptionPlan: institutions.subscriptionPlan,
        subscriptionStartDate: institutions.subscriptionStartDate,
        trialEndsAt: institutions.trialEndsAt,
        createdAt: institutions.createdAt,
        userCount: count(users.id),
      })
      .from(institutions)
      .leftJoin(users, eq(institutions.id, users.institutionId))
      .groupBy(institutions.id)
      .orderBy(desc(institutions.createdAt));

    return successResponse(institutionsWithUsers);
  } catch (error) {
    return errorResponse(error);
  }
}
