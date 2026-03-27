import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationSlots } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { rescheduleBlockSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { requireModifyPermission, validateSlotsNoConflicts, normalizeDate } from '@/lib/utils/reservations';
import { eq, and } from 'drizzle-orm';

// PUT /api/classroom-reservations/:id/reschedule-block - Reschedule all slots
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { id } = await params;

    const body = await request.json();
    console.log('[Reschedule Block] Received payload:', JSON.stringify(body, null, 2));
    
    const data = validateBody(rescheduleBlockSchema, body);
    console.log('[Reschedule Block] Validated data:', JSON.stringify(data, null, 2));

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

    if (!reservation.classroomId) {
      throw new NotFoundError('La reserva no tiene aula asignada');
    }

    // Validate no conflicts for new slots (excluding current reservation)
    const slotsToValidate = data.slots.map((slot) => ({
      classroomId: reservation.classroomId!,
      date: normalizeDate(slot.date),
      pedagogicalHourId: slot.pedagogicalHourId,
    }));

    await validateSlotsNoConflicts(slotsToValidate, id);

    // Delete old slots and create new ones in transaction
    await db.transaction(async (tx) => {
      // Delete old slots
      await tx
        .delete(reservationSlots)
        .where(eq(reservationSlots.reservationId, id));

      // Insert new slots
      const newSlotsData = data.slots.map((slot) => ({
        reservationId: id,
        institutionId,
        classroomId: reservation.classroomId!,
        pedagogicalHourId: slot.pedagogicalHourId,
        date: normalizeDate(slot.date),
        attended: false,
      }));

      console.log('[Reschedule Block] Inserting slots:', JSON.stringify(newSlotsData.map(s => ({
        ...s,
        date: s.date.toISOString()
      })), null, 2));

      await tx.insert(reservationSlots).values(newSlotsData);
    });

    // Return success (frontend will refetch via React Query invalidation)
    return successResponse({ id, success: true }, 'Reserva reprogramada exitosamente');
  } catch (error) {
    console.error('[Reschedule Block] Error:', error);
    if (error instanceof ValidationError) {
      console.error('[Reschedule Block] Validation errors:', JSON.stringify(error.errors, null, 2));
      return errorResponse(error);
    }
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('[Reschedule Block] Error message:', error.message);
      console.error('[Reschedule Block] Error stack:', error.stack);
    }
    return errorResponse(error);
  }
}
