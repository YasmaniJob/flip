/**
 * GET/POST /api/institutions/[id]/diagnostic/questions
 * 
 * Get or create custom diagnostic questions for an institution
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticQuestions, diagnosticCategories } from '@/lib/db/schema';
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
    
    // Get all categories
    const categories = await db.query.diagnosticCategories.findMany({
      where: or(
        isNull(diagnosticCategories.institutionId),
        eq(diagnosticCategories.institutionId, institutionId)
      ),
      orderBy: (categories, { asc }) => [asc(categories.order)],
    });
    
    // Get all questions (standard + institution-specific)
    const questions = await db.query.diagnosticQuestions.findMany({
      where: or(
        isNull(diagnosticQuestions.institutionId),
        eq(diagnosticQuestions.institutionId, institutionId)
      ),
      orderBy: (questions, { asc }) => [asc(questions.order)],
    });
    
    // Group questions by category
    const questionsByCategory: Record<string, typeof questions> = {};
    for (const category of categories) {
      questionsByCategory[category.id] = questions.filter(q => q.categoryId === category.id);
    }
    
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
      questions: questions.map(q => ({
        id: q.id,
        code: q.code,
        categoryId: q.categoryId,
        text: q.text,
        order: q.order,
        isActive: q.isActive,
        isCustom: q.institutionId === institutionId,
      })),
      questionsByCategory,
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
    const validation = questionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Generate unique code for custom question
    const code = `CUSTOM_${institutionId.slice(0, 8)}_${Date.now()}`;
    
    // Create custom question
    const [question] = await db.insert(diagnosticQuestions)
      .values({
        id: crypto.randomUUID(),
        code,
        categoryId: data.categoryId,
        institutionId, // Mark as institution-specific
        text: data.text,
        order: data.order,
        isActive: data.isActive,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        code: question.code,
        categoryId: question.categoryId,
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
