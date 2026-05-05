import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createLoanSchema, loansQuerySchema } from '@/lib/validations/schemas/loans';
import { LoanService } from '@/lib/services/loan-service';

// GET /api/loans
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);
    const { searchParams } = new URL(request.url);
    const query = validateQuery(loansQuerySchema, searchParams);

    const result = await LoanService.list(
      institutionId,
      { page: query.page ?? 1, limit: query.limit ?? 10 },
      user.id,
      user.role === 'docente',
    );

    return paginatedResponse(result.data, result.pagination);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/loans
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);
    const body = await request.json();
    const input = validateBody(createLoanSchema, body);

    const loan = await LoanService.create(
      institutionId,
      input,
      user.id,
      user.role === 'docente',
    );

    return successResponse(loan, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
