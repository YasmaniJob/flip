import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { returnLoanSchema } from '@/lib/validations/schemas/loans';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { loans, resources } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// PATCH /api/loans/:id/return - Return loan with damage reports
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(returnLoanSchema, body);

    const { id } = await params;

    // Check if loan exists
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.institutionId, institutionId)),
    });

    if (!loan) {
      throw new NotFoundError('Préstamo no encontrado');
    }

    // Validate that loan is active (NOT based on approvalStatus)
    if (loan.status !== 'active') {
      throw new ValidationError('El préstamo ya ha sido devuelto');
    }

    // Group resources by their status decision for batch updates
    const availableResourceIds: string[] = [];
    const maintenanceResourceIds: string[] = [];
    const bajaResourceIds: string[] = [];

    for (const resourceId of data.resourcesReceived ?? []) {
      const decision = data.resourceStatusDecisions?.[resourceId] ?? 'disponible';

      if (decision === 'disponible') {
        availableResourceIds.push(resourceId);
      } else if (decision === 'mantenimiento') {
        maintenanceResourceIds.push(resourceId);
      } else if (decision === 'baja') {
        bajaResourceIds.push(resourceId);
      }
    }

    // Update loan and resources in transaction
    await db.transaction(async (tx) => {
      // Update loan: status='returned', returnDate=now(), save reports
      await tx
        .update(loans)
        .set({
          status: 'returned',
          returnDate: new Date(),
          damageReports: data.damageReports ?? null,
          suggestionReports: data.suggestionReports ?? null,
          missingResources: data.missingResources ?? null,
          // approvalStatus NO cambia
        })
        .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)));

      // Batch update: resources to 'disponible'
      if (availableResourceIds.length > 0) {
        await tx
          .update(resources)
          .set({ status: 'disponible' })
          .where(
            and(
              eq(resources.institutionId, institutionId),
              inArray(resources.id, availableResourceIds)
            )
          );
      }

      // Batch update: resources to 'mantenimiento'
      if (maintenanceResourceIds.length > 0) {
        await tx
          .update(resources)
          .set({ status: 'mantenimiento' })
          .where(
            and(
              eq(resources.institutionId, institutionId),
              inArray(resources.id, maintenanceResourceIds)
            )
          );
      }

      // Batch update: resources to 'baja'
      if (bajaResourceIds.length > 0) {
        await tx
          .update(resources)
          .set({ status: 'baja' })
          .where(
            and(eq(resources.institutionId, institutionId), inArray(resources.id, bajaResourceIds))
          );
      }

      // Resources NOT in resourcesReceived remain 'prestado' (implicitly missing)
      // No action needed for them
    });

    // Fetch updated loan
    const updated = await db.query.loans.findFirst({
      where: eq(loans.id, id),
      with: {
        staff: true,
        loanResources: {
          with: {
            resource: {
              with: { category: true },
            },
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
