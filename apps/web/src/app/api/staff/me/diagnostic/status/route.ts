import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { diagnosticSessions, institutions, diagnosticCategories } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/staff/me/diagnostic/status - Get current user's diagnostic status
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request) as { user: any };
    const institutionId = await getInstitutionId(user);

    // Get institution config to check if diagnostic is enabled
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
      columns: {
        diagnosticEnabled: true,
      }
    });

    if (!institution?.diagnosticEnabled) {
      return successResponse({ 
        enabled: false,
        completed: false,
        message: 'El módulo de diagnóstico no está activo para esta institución.' 
      });
    }

    // Find the latest completed or in-progress session for this user
    // We match by email or DNI since the session might not be linked to staffId yet
    // OR if it is linked, we use that.
    
    // Find all completed or in-progress sessions for this user (history)
    const sessions = await db.query.diagnosticSessions.findMany({
      where: and(
        eq(diagnosticSessions.institutionId, institutionId),
        user.dni 
          ? eq(diagnosticSessions.dni, user.dni) 
          : eq(diagnosticSessions.email, user.email)
      ),
      orderBy: [desc(diagnosticSessions.createdAt)]
    });

    if (!sessions || sessions.length === 0) {
      return successResponse({
        enabled: true,
        completed: false,
        status: 'not_started',
        history: []
      });
    }

    const latestSession = sessions[0];

    // Get categories to have names for labels
    const categoriesList = await db.query.diagnosticCategories.findMany({
      where: eq(diagnosticCategories.isActive, true),
      columns: {
        id: true,
        name: true,
        code: true
      }
    });

    const categoryNames: Record<string, string> = {};
    categoriesList.forEach(c => {
      categoryNames[c.id] = c.name;
    });

    const historyRecord = sessions.map(s => ({
      id: s.id,
      overallScore: s.overallScore,
      level: s.level,
      completedAt: s.completedAt,
      status: s.status
    }));

    return successResponse({
      enabled: true,
      completed: latestSession.status === 'completed' || latestSession.status === 'approved',
      status: latestSession.status,
      overallScore: latestSession.overallScore,
      level: latestSession.level,
      categoryScores: latestSession.categoryScores,
      categoryNames,
      history: historyRecord,
      completedAt: latestSession.completedAt,
      sessionId: latestSession.id
    });
  } catch (error) {
    return errorResponse(error);
  }
}
