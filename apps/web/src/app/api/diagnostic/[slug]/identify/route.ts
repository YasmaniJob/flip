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

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limiting (stricter for POST)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 10, 3600000); // 10 requests per hour
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
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
    
    const { dni, name, email } = validation.data;
    
    // Check if this person is already a staff member
    const existingStaff = await findExistingStaff(institution.id, dni, email);
    
    // Get total questions count (we'll need this for the session)
    const questions = await db.query.diagnosticQuestions.findMany({
      where: eq(diagnosticQuestions.isActive, true),
    });
    
    // Create or resume session
    const userAgent = request.headers.get('user-agent') || undefined;
    const { session, token, isResuming } = await createOrResumeSession({
      institutionId: institution.id,
      name,
      dni,
      email,
      ipAddress: ip,
      userAgent,
      totalQuestions: questions.length,
    });
    
    return NextResponse.json({
      token,
      sessionId: session.id,
      isResuming,
      isExistingStaff: !!existingStaff,
      progress: session.progress,
      totalQuestions: session.totalQuestions,
    });
    
  } catch (error) {
    console.error('Error identifying user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
