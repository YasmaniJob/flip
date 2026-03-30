/**
 * GET /api/diagnostic/[slug]/session/[token]
 * 
 * Retrieves session progress and responses
 * Public endpoint (requires valid session token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticResponses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';
import { validateSession } from '@/features/diagnostic/lib/session-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; token: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 20, 3600000);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ENABLED === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic module is not enabled' },
        { status: 503 }
      );
    }
    
    const { slug, token } = params;
    
    // Validate institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.slug, slug),
    });
    
    if (!institution || !institution.diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic not available' },
        { status: 403 }
      );
    }
    
    // Validate session
    const userAgent = request.headers.get('user-agent') || undefined;
    const sessionValidation = await validateSession(token, ip, userAgent);
    
    if (!sessionValidation.valid || !sessionValidation.session) {
      return NextResponse.json(
        { error: sessionValidation.reason || 'Invalid session' },
        { status: 401 }
      );
    }
    
    const session = sessionValidation.session;
    
    // Get responses
    const responses = await db.query.diagnosticResponses.findMany({
      where: eq(diagnosticResponses.sessionId, session.id),
    });
    
    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        progress: session.progress,
        totalQuestions: session.totalQuestions,
        overallScore: session.overallScore,
        level: session.level,
        categoryScores: session.categoryScores,
        completedAt: session.completedAt,
      },
      responses: responses.map(r => ({
        questionId: r.questionId,
        score: r.score,
        answeredAt: r.answeredAt,
      })),
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
