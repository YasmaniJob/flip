/**
 * GET/POST /api/institutions/[id]/diagnostic/questions
 * 
 * Get or create custom diagnostic questions for an institution
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticQuestions, diagnosticCategories, institutions } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { questionRequestSchema } from '@/features/diagnostic/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const { id: institutionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Get institution to read imported base questions from settings
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    });
    
    const settings = (institution?.settings as any) || {};
    const importedBaseQuestionIds: string[] = settings.diagnostic?.importedBaseQuestions || [];
    
    // Get all categories
    const categories = await db.query.diagnosticCategories.findMany({
      where: or(
        isNull(diagnosticCategories.institutionId),
        eq(diagnosticCategories.institutionId, institutionId)
      ),
      orderBy: (categories, { asc }) => [asc(categories.order)],
    });
    
    // Get all standard questions
    const baseQuestions = await db.query.diagnosticQuestions.findMany({
      where: isNull(diagnosticQuestions.institutionId),
      with: { category: true },
      orderBy: (questions, { asc }) => [asc(questions.order)],
    });
    
    // Get all custom questions
    const customQuestions = await db.query.diagnosticQuestions.findMany({
      where: eq(diagnosticQuestions.institutionId, institutionId),
      with: { category: true },
      orderBy: (questions, { asc }) => [asc(questions.order)],
    });
    
    // Create category map for quick lookup
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    // Map function for questions
    const mapQuestion = (q: any, isCustom: boolean) => ({
      id: q.id,
      code: q.code,
      categoryId: q.categoryId,
      categoryName: q.category?.name || categoryMap.get(q.categoryId)?.name || 'Sin categoría',
      text: q.text,
      order: q.order,
      isActive: q.isActive,
      isCustom,
    });
    
    const catalogQuestions = baseQuestions.map(q => mapQuestion(q, false));
    const activeCustom = customQuestions.map(q => mapQuestion(q, true));
    
    // Filter base questions that have been imported
    const activeImported = catalogQuestions.filter(q => importedBaseQuestionIds.includes(q.id));
    
    // All active questions to show in Cuestionario tab
    const activeQuestions = [...activeCustom, ...activeImported].sort((a, b) => a.order - b.order);
    
    return NextResponse.json({
      categories: categories.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        order: c.order,
        isActive: c.isActive,
        isCustom: c.institutionId === institutionId,
      })),
      activeQuestions,
      catalogQuestions,
      importedBaseQuestionIds,
    });
    
  } catch (error) {
    console.error('Error fetching diagnostic questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const { id: institutionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    
    // For creating, categoryId and text are required
    if (!body.categoryId || !body.text) {
      return NextResponse.json(
        { error: 'categoryId and text are required for creating a question' },
        { status: 400 }
      );
    }
    
    const validation = questionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Get the highest order number for this category to append at the end
    const existingQuestions = await db.query.diagnosticQuestions.findMany({
      where: and(
        eq(diagnosticQuestions.categoryId, data.categoryId!),
        or(
          isNull(diagnosticQuestions.institutionId),
          eq(diagnosticQuestions.institutionId, institutionId)
        )
      ),
      orderBy: (questions, { desc }) => [desc(questions.order)],
    });
    
    const nextOrder = existingQuestions.length > 0 ? existingQuestions[0].order + 1 : 1;
    
    // Generate unique code for custom question
    const code = `CUSTOM_${institutionId.slice(0, 8)}_${Date.now()}`;
    
    // Create custom question
    const [question] = await db.insert(diagnosticQuestions)
      .values({
        id: crypto.randomUUID(),
        code,
        categoryId: data.categoryId!,
        institutionId, // Mark as institution-specific
        text: data.text!,
        order: data.order ?? nextOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    
    // Get category name for response
    const category = await db.query.diagnosticCategories.findFirst({
      where: eq(diagnosticCategories.id, data.categoryId!),
    });
    
    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        code: question.code,
        categoryId: question.categoryId,
        categoryName: category?.name || 'Sin categoría',
        text: question.text,
        order: question.order,
        isActive: question.isActive,
        isCustom: true,
      },
    });
    
  } catch (error) {
    console.error('Error creating diagnostic question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
