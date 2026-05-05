import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { LoanService } from '@/lib/services/loan-service';

// PATCH /api/loans/:id/approve
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);
    const { id } = await params;

    const updated = await LoanService.approve(id, institutionId);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
