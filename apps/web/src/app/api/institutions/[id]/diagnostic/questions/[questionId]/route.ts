/**
 * PATCH/DELETE /api/institutions/[id]/diagnostic/questions/[questionId]
 * 
 * Update or delete a custom diagnostic question
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticQuestions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { questionRequestSchema } from '@/features/diagnostic/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId, questionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Check if question exists and belongs to institution
    const existingQuestion = await db.query.diagnosticQuestions.findFirst({
      where: and(
        eq(diagnosticQuestions.id, questionId),
        eq(diagnosticQuestions.institutionId, institutionId)
      ),
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found or not editable' },
        { status: 404 }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    const validation = questionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Update question
    const [updated] = await db.update(diagnosticQuestions)
      .set({
        text: data.text,
        order: data.order,
        isActive: data.isActive,
      })
      .where(eq(diagnosticQuestions.id, questionId))
      .returning();
    
    return NextResponse.json({
      success: true,
      question: {
        id: updated.id,
        code: updated.code,
        categoryId: updated.categoryId,
        text: updated.text,
        order: updated.order,
        isActive: updated.isActive,
        isCustom: true,
      },
    });
    
  } catch (error) {
    console.error('Error updating diagnostic question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId, questionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Check if question exists and belongs to institution
    const existingQuestion = await db.query.diagnosticQuestions.findFirst({
      where: and(
        eq(diagnosticQuestions.id, questionId),
        eq(diagnosticQuestions.institutionId, institutionId)
      ),
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found or not deletable' },
        { status: 404 }
      );
    }
    
    // Delete question (or mark as inactive)
    await db.update(diagnosticQuestions)
      .set({ isActive: false })
      .where(eq(diagnosticQuestions.id, questionId));
    
    return NextResponse.json({
      success: true,
      message: 'Question deactivated successfully',
    });
    
  } catch (error) {
    console.error('Error deleting diagnostic question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
