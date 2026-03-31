/**
 * GET /api/diagnostic/[slug]/history
 * 
 * Retrieves multi-year diagnostic history for a teacher
 * Requires authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticSessions, staff } from '@/lib/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface EvolutionMetrics {
  yearsCount: number;
  firstYear: number;
  lastYear: number;
  improvements: {
    [dimension: string]: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ENABLED === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic module is not enabled' },
        { status: 503 }
      );
    }
    
    // Validate institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.slug, slug),
    });
    
    if (!institution || !institution.diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic not available for this institution' },
        { status: 403 }
      );
    }
    
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user as any;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const userId = searchParams.get('userId');
    
    if (!staffId && !userId) {
      return NextResponse.json(
        { error: 'staffId or userId is required' },
        { status: 400 }
      );
    }
    
    // Authorization: Check if user can access this history
    // 1. User is requesting their own history (by matching DNI/email)
    // 2. User is admin of the institution
    let isAuthorized = false;
    
    if (staffId) {
      // Check if requesting user is the staff member (match by DNI/email)
      const targetStaff = await db.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });
      
      if (targetStaff) {
        const userDni = user.dni;
        const userEmail = user.email;
        
        if ((userDni && targetStaff.dni === userDni) || 
            (userEmail && targetStaff.email === userEmail)) {
          isAuthorized = true;
        }
      }
    }
    
    if (userId && userId === user.id) {
      isAuthorized = true;
    }
    
    // Check if user is admin of the institution
    if (!isAuthorized) {
      const userDni = user.dni;
      const userEmail = user.email;
      
      const conditions = [];
      if (userDni) conditions.push(eq(staff.dni, userDni));
      if (userEmail) conditions.push(eq(staff.email, userEmail));
      
      const adminStaff = conditions.length > 0 
        ? await db.query.staff.findFirst({
            where: and(
              eq(staff.institutionId, institution.id),
              or(...conditions)
            ),
          })
        : null;
      
      if (adminStaff?.role === 'admin' || adminStaff?.role === 'director') {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a este histórico' },
        { status: 403 }
      );
    }
    
    // Fetch all completed/approved sessions for the teacher, ordered by year DESC
    const whereConditions = [
      eq(diagnosticSessions.institutionId, institution.id),
    ];
    
    if (staffId) {
      whereConditions.push(eq(diagnosticSessions.staffId, staffId));
    } else if (userId) {
      whereConditions.push(eq(diagnosticSessions.userId, userId));
    }
    
    const sessions = await db.query.diagnosticSessions.findMany({
      where: and(...whereConditions),
      orderBy: [desc(diagnosticSessions.year)],
    });
    
    // Filter only completed or approved sessions
    const completedSessions = sessions.filter(
      s => s.status === 'completed' || s.status === 'approved'
    );
    
    // Format sessions for response
    const formattedSessions = completedSessions.map(session => ({
      id: session.id,
      year: session.year,
      completedAt: session.completedAt,
      results: {
        ...(session.categoryScores as Record<string, number> || {}),
        overall: session.overallScore || 0,
      },
      level: session.level,
    }));
    
    // Calculate evolution if there are 2+ sessions
    let evolution: EvolutionMetrics | null = null;
    
    if (completedSessions.length >= 2) {
      const firstSession = completedSessions[completedSessions.length - 1];
      const lastSession = completedSessions[0];
      
      const firstScores = firstSession.categoryScores as Record<string, number> || {};
      const lastScores = lastSession.categoryScores as Record<string, number> || {};
      
      const improvements: Record<string, number> = {};
      
      // Calculate improvements for each dimension
      for (const dimension in lastScores) {
        if (firstScores[dimension] !== undefined) {
          improvements[dimension] = lastScores[dimension] - firstScores[dimension];
        }
      }
      
      // Calculate overall improvement
      const firstOverall = firstSession.overallScore || 0;
      const lastOverall = lastSession.overallScore || 0;
      improvements.overall = lastOverall - firstOverall;
      
      evolution = {
        yearsCount: completedSessions.length,
        firstYear: firstSession.year,
        lastYear: lastSession.year,
        improvements,
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
        evolution,
      },
    });
    
  } catch (error) {
    console.error('[DIAGNOSTIC_HISTORY] Uncaught error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
