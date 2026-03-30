/**
 * PATCH/DELETE /api/institutions/[id]/diagnostic/questions/[questionId]
 * 
 * Update or delete a custom diagnostic question
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticQuestions, diagnosticCategories, institutions } from '@/lib/db/schema';
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
    
    // Parse request body
    const body = await request.json();
    
    // Check if question exists
    const existingQuestion = await db.query.diagnosticQuestions.findFirst({
      where: eq(diagnosticQuestions.id, questionId),
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Forbid edition of base questions completely via UI logic definition
    if (!existingQuestion.institutionId) {
      return NextResponse.json(
        { error: 'Las preguntas Base Flip no pueden ser editadas. Para hacer cambios, crea una pregunta personalizada.' },
        { status: 403 }
      );
    }
    
    // For custom questions, verify ownership
    if (existingQuestion.institutionId !== institutionId) {
      return NextResponse.json(
        { error: 'Question not found or not editable' },
        { status: 404 }
      );
    }
    
    // Parse and validate request for custom questions
    const validation = questionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Update question (only update fields that are provided)
    const updateData: any = {};
    if (data.text !== undefined) updateData.text = data.text;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    const [updated] = await db.update(diagnosticQuestions)
      .set(updateData)
      .where(eq(diagnosticQuestions.id, questionId))
      .returning();
    
    // Get category name for response
    const category = await db.query.diagnosticCategories.findFirst({
      where: eq(diagnosticCategories.id, updated.categoryId),
    });
    
    return NextResponse.json({
      success: true,
      question: {
        id: updated.id,
        code: updated.code,
        categoryId: updated.categoryId,
        categoryName: category?.name || 'Sin categoría',
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
    
    // Check if question exists
    const existingQuestion = await db.query.diagnosticQuestions.findFirst({
      where: eq(diagnosticQuestions.id, questionId)
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found or not deletable' },
        { status: 404 }
      );
    }

    // BASE QUESTION: REMOVE FROM SETTINGS CATALOG
    if (!existingQuestion.institutionId) {
      const institution = await db.query.institutions.findFirst({ where: eq(institutions.id, institutionId) });
      const settings = (institution?.settings as any) || {};
      const imported = settings.diagnostic?.importedBaseQuestions || [];
      
      const newSettings = {
        ...settings,
        diagnostic: {
          ...(settings.diagnostic || {}),
          importedBaseQuestions: imported.filter((id: string) => id !== questionId)
        }
      };

      await db.update(institutions)
        .set({ settings: newSettings })
        .where(eq(institutions.id, institutionId));
      
      return NextResponse.json({ success: true, message: 'Pregunta base removida del cuestionario.' });
    }
    
    // CUSTOM QUESTION: HARD DELETE
    if (existingQuestion.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Question not found or not deletable' }, { status: 403 });
    }
    
    await db.delete(diagnosticQuestions)
      .where(eq(diagnosticQuestions.id, questionId));
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting diagnostic question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
