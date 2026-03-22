import { NextRequest } from 'next/server';
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { loans, resources } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// PATCH /api/loans/:id/reject - Reject pending loan (admin/pip only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const { id } = params;

    // Check if loan exists and get resources
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.institutionId, institutionId)),
      with: {
        loanResources: true,
      },
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

    const resourceIds = loan.loanResources.map((lr) => lr.resourceId);

    // Update loan and release resources in transaction
    await db.transaction(async (tx) => {
      // Update only approvalStatus, status remains 'active'
      await tx
        .update(loans)
        .set({
          approvalStatus: 'rejected',
          // status NO cambia, sigue 'active'
        })
        .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)));

      // Release resources back to 'disponible'
      if (resourceIds.length > 0) {
        await tx
          .update(resources)
          .set({ status: 'disponible' })
          .where(
            and(eq(resources.institutionId, institutionId), inArray(resources.id, resourceIds))
          );
      }
    });

    // Fetch updated loan
    const updated = await db.query.loans.findFirst({
      where: eq(loans.id, id),
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
