/**
 * POST /api/diagnostic/[slug]/response
 * 
 * Saves a response to a diagnostic question
 * Public endpoint (requires valid session token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticResponses, diagnosticSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';
import { saveResponseRequestSchema } from '@/features/diagnostic/lib/validation';
import { validateSession } from '@/features/diagnostic/lib/session-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 50, 3600000); // 50 requests per hour (for answering questions)
    
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
    const validation = saveResponseRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { token, questionId, score } = validation.data;
    
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
    
    // Check if session is still in progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }
    
    // Upsert response (update if exists, insert if not)
    await db.insert(diagnosticResponses)
      .values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        questionId,
        score,
      })
      .onConflictDoUpdate({
        target: [diagnosticResponses.sessionId, diagnosticResponses.questionId],
        set: {
          score,
          answeredAt: new Date(),
        },
      });
    
    // Update session progress
    const responses = await db.query.diagnosticResponses.findMany({
      where: eq(diagnosticResponses.sessionId, session.id),
    });
    
    const progress = responses.length;
    
    await db.update(diagnosticSessions)
      .set({
        progress,
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessions.id, session.id));
    
    return NextResponse.json({
      success: true,
      progress,
      totalQuestions: session.totalQuestions,
    });
    
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
