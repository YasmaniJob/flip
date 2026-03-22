import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { requireModifyPermission } from '@/lib/utils/reservations';
import { eq, and } from 'drizzle-orm';

// PUT /api/classroom-reservations/:id/cancel - Cancel reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { id } = await params;

    // Get reservation
    const reservation = await db.query.classroomReservations.findFirst({
      where: and(
        eq(classroomReservations.id, id),
        eq(classroomReservations.institutionId, institutionId)
      ),
    });

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada');
    }

    // Check permissions
    requireModifyPermission(reservation, user);

    // Update status to cancelled
    const [updated] = await db
      .update(classroomReservations)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
      })
      .where(
        and(
          eq(classroomReservations.id, id),
          eq(classroomReservations.institutionId, institutionId)
        )
      )
      .returning();

    return successResponse(updated, 'Reserva cancelada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
