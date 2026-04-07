/**
 * POST /api/diagnostic/[slug]/identify
 * 
 * Identifies a teacher and creates/resumes a diagnostic session
 * Public endpoint (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';
import { identifyRequestSchema } from '@/features/diagnostic/lib/validation';
import { createOrResumeSession, findExistingStaff } from '@/features/diagnostic/lib/session-manager';
import { getCurrentYear } from '@/features/diagnostic/services/year-service';
import { checkExistingSession } from '@/features/diagnostic/services/validation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // Get IP for session validation
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting (disabled for testing)
    // const isDev = process.env.NODE_ENV === 'development';
    // const limit = isDev ? 100 : 25;
    // const rateLimitResult = rateLimit(ip, limit, 3600000);
    // 
    // if (!rateLimitResult.success && !isDev) {
    //   return NextResponse.json(
    //     { error: 'Demasiados intentos. Por favor, intenta de nuevo en una hora.' },
    //     {
    //       status: 429,
    //       headers: {
    //         'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    //         'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    //         'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
    //       },
    //     }
    //   );
    // }
    
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ENABLED === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic module is not enabled' },
        { status: 503 }
      );
    }
    
    // const { slug } = params; // Already destructured above
    
    // Find institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.slug, slug),
    });
    
    if (!institution || !institution.diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic not available for this institution' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = identifyRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { dni, name, email, userId } = validation.data;
    
    // Get current year for annual periodization
    const currentYear = getCurrentYear();
    
    // Check if this person is already a staff member
    const existingStaff = await findExistingStaff(institution.id, dni ?? undefined, email);
    
    // Check if teacher already completed diagnostic this year
    if (existingStaff) {
      const existingSession = await checkExistingSession(
        institution.id,
        existingStaff.id,
        null,
        currentYear
      );
      
      if (existingSession) {
        // Teacher already completed diagnostic this year
        return NextResponse.json({
          canComplete: false,
          year: currentYear,
          existingSession: {
            id: existingSession.id,
            completedAt: existingSession.completedAt,
            year: existingSession.year,
            overallScore: existingSession.overallScore,
            level: existingSession.level,
          },
          staff: {
            id: existingStaff.id,
            name: existingStaff.name,
          },
        });
      }
    }
    
    // Get total questions count (we'll need this for the session)
    const questions = await db.query.diagnosticQuestions.findMany({
      where: eq(diagnosticQuestions.isActive, true),
    });
    
    // Create or resume session
    const userAgent = request.headers.get('user-agent') || undefined;
    const { session, token, isResuming } = await createOrResumeSession({
      institutionId: institution.id,
      userId: userId ?? undefined,
      name,
      dni: dni ?? undefined,
      email,
      ipAddress: ip,
      userAgent,
      totalQuestions: questions.length,
    });
    
    return NextResponse.json({
      canComplete: true,
      year: currentYear,
      token,
      sessionId: session.id,
      isResuming,
      isExistingStaff: !!existingStaff,
      progress: session.progress,
      totalQuestions: session.totalQuestions,
    });
    
  } catch (error) {
    console.error('[DIAGNOSTIC_IDENTIFY] Uncaught error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
