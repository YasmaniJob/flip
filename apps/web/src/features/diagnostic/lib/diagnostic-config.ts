import { db } from '@/lib/db';
import { institutions, diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export const getCachedDiagnosticConfig = unstable_cache(
  async (slug: string) => {
    // Find institution by slug
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.slug, slug),
    });
    
    if (!institution) return null;
    if (!institution.diagnosticEnabled) return { disabled: true };
    
    // Get active categories
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
    
    // Get active questions
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
    
    // Filter and sort
    const activeQuestions = questions.filter(q => categoryIds.includes(q.categoryId));
    const sortedQuestions = activeQuestions.sort((a, b) => {
      const catA = categories.find(c => c.id === a.categoryId);
      const catB = categories.find(c => c.id === b.categoryId);
      if (!catA || !catB) return 0;
      if (catA.order !== catB.order) return catA.order - catB.order;
      return a.order - b.order;
    });

    return {
      enabled: true,
      requiresApproval: institution.diagnosticRequiresApproval,
      customMessage: institution.diagnosticCustomMessage,
      institutionId: institution.id,
      institutionName: institution.name,
      institutionLogo: (institution.settings as any)?.logoUrl || (institution.settings as any)?.logo || null,
      educationalLevel: institution.nivel || (institution.settings as any)?.location?.nivel || 'Secundaria',
      province: (institution.settings as any)?.location?.provincia || (institution.settings as any)?.location?.prov || null,
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
    } as any;
  },
  ['diagnostic-config-cache'],
  { revalidate: 3600, tags: ['diagnostic-config'] } // Cache for 1 hour
);
