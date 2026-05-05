import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { LoanService } from '@/lib/services/loan-service';

// PATCH /api/loans/:id/reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const updated = await LoanService.reject(id, institutionId);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
