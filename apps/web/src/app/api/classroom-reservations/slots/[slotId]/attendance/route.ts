import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationSlots } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { markAttendanceSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { requireModifyPermission } from '@/lib/utils/reservations';
import { eq } from 'drizzle-orm';

// PUT /api/classroom-reservations/slots/:slotId/attendance - Mark attendance on slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { slotId } = await params;

    const body = await request.json();
    const data = validateBody(markAttendanceSchema, body);

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

    // Update attendance
    const [updated] = await db
      .update(reservationSlots)
      .set({
        attended: data.attended,
        attendedAt: data.attended ? new Date() : null,
      })
      .where(eq(reservationSlots.id, slotId))
      .returning();

    return successResponse(updated, 'Asistencia actualizada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
