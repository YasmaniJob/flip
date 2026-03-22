import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { loans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/loans/:id/approve - Approve pending loan (admin/pip only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const { id } = await params;

    // Check if loan exists
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.institutionId, institutionId)),
    });

    if (!loan) {
      throw new NotFoundError('Préstamo no encontrado');
    }

    // Validate that loan is pending
    if (loan.approvalStatus !== 'pending') {
      throw new ValidationError(
        `El préstamo ya está ${loan.approvalStatus === 'approved' ? 'aprobado' : 'rechazado'}`
      );
    }

    // Update only approvalStatus, status remains 'active'
    const [updated] = await db
      .update(loans)
      .set({
        approvalStatus: 'approved',
        // status NO cambia, ya es 'active'
      })
      .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)))
      .returning();

    // Resources are already 'prestado' since loan creation, no need to update

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
