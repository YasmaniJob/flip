import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/resources/stats - Get resource statistics by status
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    // Execute 5 count queries in parallel
    const [total, disponible, prestado, mantenimiento, baja] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(eq(resources.institutionId, institutionId)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(and(eq(resources.institutionId, institutionId), eq(resources.status, 'disponible'))),

      db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(and(eq(resources.institutionId, institutionId), eq(resources.status, 'prestado'))),

      db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(and(eq(resources.institutionId, institutionId), eq(resources.status, 'mantenimiento'))),

      db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(and(eq(resources.institutionId, institutionId), eq(resources.status, 'baja'))),
    ]);

    return successResponse({
      total: Number(total[0]?.count || 0),
      disponible: Number(disponible[0]?.count || 0),
      prestado: Number(prestado[0]?.count || 0),
      mantenimiento: Number(mantenimiento[0]?.count || 0),
      baja: Number(baja[0]?.count || 0),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
