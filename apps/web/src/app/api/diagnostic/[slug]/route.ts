/**
 * GET /api/diagnostic/[slug]
 * 
 * Returns diagnostic configuration and active questions for an institution
 * Public endpoint (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions, diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 20, 3600000); // 20 requests per hour
    
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
    
    // Find institution by slug
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.slug, slug),
    });
    
    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }
    
    // Check if diagnostic is enabled for this institution
    if (!institution.diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic is not enabled for this institution' },
        { status: 403 }
      );
    }
    
    // Get active categories (standard + institution-specific)
    const categories = await db.query.diagnosticCategories.findMany({
      where: and(
        or(
          isNull(diagnosticCategories.institutionId),
          eq(diagnosticCategories.institutionId, institution.id)
        ),
        eq(diagnosticCategories.isActive, true)
      ),
      orderBy: (categories, { asc }) => [asc(categories.order)],
    });
    
    // Get active questions for these categories
    const categoryIds = categories.map(c => c.id);
    const questions = await db.query.diagnosticQuestions.findMany({
      where: and(
        or(
          isNull(diagnosticQuestions.institutionId),
          eq(diagnosticQuestions.institutionId, institution.id)
        ),
        eq(diagnosticQuestions.isActive, true)
      ),
      orderBy: (questions, { asc }) => [asc(questions.order)],
    });
    
    // Filter questions by active categories
    const activeQuestions = questions.filter(q => categoryIds.includes(q.categoryId));
    
    // Sort questions by category order first, then by question order
    const sortedQuestions = activeQuestions.sort((a, b) => {
      const catA = categories.find(c => c.id === a.categoryId);
      const catB = categories.find(c => c.id === b.categoryId);
      
      if (!catA || !catB) return 0;
      
      // First sort by category order
      if (catA.order !== catB.order) {
        return catA.order - catB.order;
      }
      
      // Then sort by question order within category
      return a.order - b.order;
    });
    
    return NextResponse.json({
      enabled: true,
      requiresApproval: institution.diagnosticRequiresApproval,
      customMessage: institution.diagnosticCustomMessage,
      institutionName: institution.name,
      institutionLogo: (institution.settings as any)?.logoUrl || null,
      categories: categories.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        order: c.order,
      })),
      questions: sortedQuestions.map(q => ({
        id: q.id,
        code: q.code,
        categoryId: q.categoryId,
        text: q.text,
        order: q.order,
      })),
      totalQuestions: sortedQuestions.length,
    });
    
  } catch (error) {
    console.error('Error fetching diagnostic config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
