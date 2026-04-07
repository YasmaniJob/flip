/**
 * POST /api/diagnostic/[slug]/complete
 * 
 * Completes a diagnostic session and calculates scores
 * Public endpoint (requires valid session token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticSessions, diagnosticResponses, staff } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { completeSessionRequestSchema } from '@/features/diagnostic/lib/validation';
import { validateSession } from '@/features/diagnostic/lib/session-manager';
import { calculateCategoryScores, calculateOverallScore, determineLevel } from '@/features/diagnostic/lib/scoring';
import { randomUUID } from 'crypto';
import { getCurrentYear } from '@/features/diagnostic/services/year-service';
import { validateUniqueSession } from '@/features/diagnostic/services/validation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // Get IP for session validation
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ENABLED === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic module is not enabled' },
        { status: 503 }
      );
    }
    
    // const { slug } = params; // Already destructured above
    
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
    console.log('[DIAGNOSTIC_COMPLETE] Request body:', { token: body.token, tokenType: typeof body.token });
    
    const requestValidation = completeSessionRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      console.error('[DIAGNOSTIC_COMPLETE] Validation failed:', requestValidation.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: requestValidation.error.errors,
          receivedToken: body.token,
          tokenType: typeof body.token,
        },
        { status: 400 }
      );
    }
    
    const { token } = requestValidation.data;
    
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
    
    // Get current year and validate uniqueness
    const currentYear = getCurrentYear();
    
    // Validate that we can create a session for this year
    // Use all available identifiers: staffId, userId, email, dni
    const uniquenessValidation = await validateUniqueSession(
      session.institutionId,
      session.staffId || null,
      session.userId || null,
      currentYear,
      session.email || null,
      session.dni || null
    );
    
    if (!uniquenessValidation.valid) {
      return NextResponse.json(
        { 
          error: uniquenessValidation.reason || 'Ya existe un diagnóstico completado para este año',
          code: 'DUPLICATE_SESSION',
          data: {
            existingYear: uniquenessValidation.existingYear,
            existingSessionId: uniquenessValidation.existingSessionId,
            completedAt: uniquenessValidation.completedAt,
          }
        },
        { status: 409 }
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
    
    // Determine final status based on institution settings and staff existence
    let finalStatus: 'completed' | 'approved' = 'completed';
    let staffId: string | undefined = undefined;
    
    // Check if this person is already a staff member
    const staffConditions = [];
    if (session.dni) staffConditions.push(eq(staff.dni, session.dni));
    if (session.email) staffConditions.push(eq(staff.email, session.email));

    const existingStaff = (staffConditions.length > 0) 
      ? await db.query.staff.findFirst({
          where: and(
            eq(staff.institutionId, institution.id),
            staffConditions.length > 1 ? or(...staffConditions) : staffConditions[0]
          ),
        })
      : null;
    
    if (existingStaff) {
      // Staff already exists → auto-approve
      finalStatus = 'approved';
      staffId = existingStaff.id;
    } else if (!institution.diagnosticRequiresApproval) {
      // No approval required → create staff and auto-approve
      try {
        const [newStaff] = await db.insert(staff)
          .values({
            id: randomUUID(),
            institutionId: institution.id,
            name: session.name,
            dni: session.dni,
            email: session.email,
            role: 'docente',
            status: 'active',
          })
          .returning();
        
        finalStatus = 'approved';
        staffId = newStaff.id;
      } catch (insertError) {
        console.error('[DIAGNOSTIC_COMPLETE] Error creating staff:', insertError);
        // If insertion fails (e.g. concurrency), we continue as 'completed'
        finalStatus = 'completed';
      }
    }
    // else: requires approval and staff doesn't exist → leave as 'completed' (pending)
    
    // Update session with year assignment
    try {
      await db.update(diagnosticSessions)
        .set({
          status: finalStatus,
          staffId,
          year: currentYear, // Assign current year
          overallScore,
          level,
          categoryScores,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(diagnosticSessions.id, session.id));
    } catch (updateError: any) {
      // Handle constraint violation (race condition)
      if (updateError.code === '23505') {
        return NextResponse.json(
          { 
            error: 'Ya existe un diagnóstico completado para el año ' + currentYear,
            code: 'DATABASE_CONSTRAINT_VIOLATION',
            data: {
              constraint: updateError.constraint || 'unique_institution_staff_year',
            }
          },
          { status: 409 }
        );
      }
      throw updateError;
    }
    
    return NextResponse.json({
      success: true,
      year: currentYear,
      overallScore,
      level,
      categoryScores,
      requiresApproval: finalStatus === 'completed',
    });
    
  } catch (error) {
    console.error('[DIAGNOSTIC_COMPLETE] Uncaught error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
