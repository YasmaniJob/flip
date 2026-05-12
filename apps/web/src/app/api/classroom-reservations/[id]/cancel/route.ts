import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationSlots } from '@/lib/db/schema';
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
    const institutionId = await getInstitutionId(user);
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
    await requireModifyPermission(reservation, user);

    // Update status to cancelled and DELETE SLOTS to free them up
    // We delete slots because the unique index (classroomId, date, hour) in reservation_slots 
    // is global and doesn't know about the 'cancelled' status in classroom_reservations.
    const [updated] = await db.transaction(async (tx) => {
      // 1. Delete associated slots first
      await tx
        .delete(reservationSlots)
        .where(eq(reservationSlots.reservationId, id));

      // 2. Update status to cancelled
      const [res] = await tx
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
      
      return [res];
    });

    return successResponse(updated, 'Reserva cancelada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
