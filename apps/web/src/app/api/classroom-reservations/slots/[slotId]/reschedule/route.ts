import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationSlots } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { rescheduleSlotSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { requireModifyPermission, hasSlotConflict, normalizeDate } from '@/lib/utils/reservations';
import { ValidationError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';

// PUT /api/classroom-reservations/slots/:slotId/reschedule - Reschedule individual slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { slotId } = await params;

    const body = await request.json();
    const data = validateBody(rescheduleSlotSchema, body);

    // Get slot with reservation
    const slot = await db.query.reservationSlots.findFirst({
      where: eq(reservationSlots.id, slotId),
      with: {
        reservation: true,
      },
    });

    if (!slot) {
      throw new NotFoundError('Slot no encontrado');
    }

    // Verify institution
    if (slot.institutionId !== institutionId) {
      throw new NotFoundError('Slot no encontrado');
    }

    // Check permissions
    requireModifyPermission(slot.reservation, user);

    // Validate no conflict in new date/time (excluding current reservation)
    const newDate = normalizeDate(data.newDate);
    const conflict = await hasSlotConflict(
      slot.classroomId,
      newDate,
      data.newPedagogicalHourId,
      slot.reservationId
    );

    if (conflict) {
      const dateStr = newDate.toISOString().split('T')[0];
      throw new ValidationError(
        `El horario ya está reservado: ${dateStr} - Hora pedagógica ${data.newPedagogicalHourId}`
      );
    }

    // Update slot
    const [updated] = await db
      .update(reservationSlots)
      .set({
        date: newDate,
        pedagogicalHourId: data.newPedagogicalHourId,
      })
      .where(eq(reservationSlots.id, slotId))
      .returning();

    // Return with pedagogical hour relation
    const slotWithRelations = await db.query.reservationSlots.findFirst({
      where: eq(reservationSlots.id, updated.id),
      with: {
        pedagogicalHour: true,
      },
    });

    return successResponse(slotWithRelations, 'Slot reprogramado exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
