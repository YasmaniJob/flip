import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';

// Cache for 5 minutes
export const revalidate = 300;

// GET /api/institutions/my-institution - Get current user's institution
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { user } = await requireAuth(request);

    if (!user.institutionId) {
      throw new UnauthorizedError('No tienes una institución asignada');
    }

    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, user.institutionId),
    });

    if (!institution) {
      throw new NotFoundError('Institución no encontrada');
    }

    console.log(`[TIMING] my-institution GET: ${Date.now() - start}ms`);
    return successResponse(institution);
  } catch (error) {
    console.log(`[TIMING] my-institution GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}
