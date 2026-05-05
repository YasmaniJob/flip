import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { returnLoanSchema } from '@/lib/validations/schemas/loans';
import { LoanService } from '@/lib/services/loan-service';

// PATCH /api/loans/:id/return
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);
    const { id } = await params;
    const body = await request.json();
    const input = validateBody(returnLoanSchema, body);

    const updated = await LoanService.return(id, institutionId, input);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
