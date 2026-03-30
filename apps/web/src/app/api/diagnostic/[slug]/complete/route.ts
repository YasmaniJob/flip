/**
 * POST /api/diagnostic/[slug]/complete
 * 
 * Completes a diagnostic session and calculates scores
 * Public endpoint (requires valid session token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticSessions, diagnosticResponses, diagnosticQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';
import { completeSessionRequestSchema } from '@/features/diagnostic/lib/validation';
import { validateSession } from '@/features/diagnostic/lib/session-manager';
import { calculateCategoryScores, calculateOverallScore, determineLevel } from '@/features/diagnostic/lib/scoring';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 10, 3600000);
    
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
    
    const { slug } = params;
    
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
    
    // Parse and validate request
    const body = await request.json();
    const validation = completeSessionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { token } = validation.data;
    
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
    
    // Check if session is in progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }
    
    // Get all responses
    const responses = await db.query.diagnosticResponses.findMany({
      where: eq(diagnosticResponses.sessionId, session.id),
    });
    
    // Get all questions to map categories
    const questions = await db.query.diagnosticQuestions.findMany();
    
    // Build questionsByCategory map
    const questionsByCategory: Record<string, string[]> = {};
    for (const question of questions) {
      if (!questionsByCategory[question.categoryId]) {
        questionsByCategory[question.categoryId] = [];
      }
      questionsByCategory[question.categoryId].push(question.id);
    }
    
    // Calculate scores
    const categoryScores = calculateCategoryScores(
      responses.map(r => ({ questionId: r.questionId, score: r.score })),
      questionsByCategory
    );
    
    const overallScore = calculateOverallScore(categoryScores);
    const level = determineLevel(overallScore);
    
    // Update session
    await db.update(diagnosticSessions)
      .set({
        status: 'completed',
        overallScore,
        level,
        categoryScores,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessions.id, session.id));
    
    return NextResponse.json({
      success: true,
      overallScore,
      level,
      categoryScores,
    });
    
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
