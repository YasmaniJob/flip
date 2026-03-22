import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { loanResources, loans, users } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull, desc } from 'drizzle-orm';

// GET /api/resources/:id/last-damage-report - Get last damage report for resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { id: resourceId } = params;

    // Step 1: Find all loans that contain this resource
    const loanResourceRows = await db
      .select({ loanId: loanResources.loanId })
      .from(loanResources)
      .where(eq(loanResources.resourceId, resourceId));

    if (loanResourceRows.length === 0) {
      return successResponse(null);
    }

    const loanIds = loanResourceRows.map((r) => r.loanId);

    // Step 2: Find the most recent returned loan with damage reports
    const loan = await db.query.loans.findFirst({
      where: and(
        eq(loans.institutionId, institutionId),
        inArray(loans.id, loanIds),
        eq(loans.status, 'returned'),
        isNotNull(loans.damageReports)
      ),
      with: { staff: true },
      orderBy: [desc(loans.returnDate)],
    });

    if (!loan) {
      return successResponse(null);
    }

    // Step 3: Parse damage reports JSON
    const reports = loan.damageReports as Record<string, any> | null;
    if (!reports) {
      return successResponse(null);
    }

    // damageReports structure: { [resourceId]: { commonProblems: string[], otherNotes?: string } }
    const resourceReport = reports[resourceId];
    const damages: string[] = resourceReport?.commonProblems ?? [];
    const damageNotes: string = resourceReport?.otherNotes ?? '';

    // Step 4: Parse suggestion reports JSON
    // suggestionReports structure: { [resourceId]: { commonSuggestions: string[], otherNotes?: string } }
    const suggestionData = (loan.suggestionReports as Record<string, any> | null)?.[resourceId];
    const suggestions: string[] = [
      ...(suggestionData?.commonSuggestions ?? []),
      ...(suggestionData?.otherNotes ? [suggestionData.otherNotes] : []),
    ];

    // Step 5: Early return if no damages or suggestions
    if (damages.length === 0 && !damageNotes && suggestions.length === 0) {
      return successResponse(null);
    }

    // Combine damages with notes
    const allDamages = damageNotes ? [...damages, damageNotes] : damages;

    // Double check (from original code)
    if (damages.length === 0 && suggestions.length === 0) {
      return successResponse(null);
    }

    // Step 6: Resolve reporter name with fallback
    // FALLBACK STAFF → USER: Si no hay staffId, buscar en users por requestedByUserId
    let reportedBy = loan.staff?.name ?? 'Desconocido';
    
    // ⚠️ FALLBACK: Si el préstamo no tiene staffId, buscar en users
    if (!loan.staffId && (loan as any).requestedByUserId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, (loan as any).requestedByUserId),
      });
      if (user) {
        reportedBy = user.name;
      }
    }

    return successResponse({
      loanId: loan.id,
      reportDate: loan.returnDate ?? loan.loanDate,
      reportedBy,
      damages: allDamages,
      suggestions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
