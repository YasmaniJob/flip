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
    await requireModifyPermission(slot.reservation, user);

    // Update attendance
    const updateData: any = {};
    
    if (data.attended !== undefined) {
      updateData.attended = data.attended;
      updateData.attendedAt = data.attended ? new Date() : null;
      // If marking as attended, clear notAttended
      if (data.attended) {
        updateData.notAttended = false;
        updateData.notAttendedAt = null;
      }
    }
    
    if (data.notAttended !== undefined) {
      updateData.notAttended = data.notAttended;
      updateData.notAttendedAt = data.notAttended ? new Date() : null;
      // If marking as not attended, clear attended
      if (data.notAttended) {
        updateData.attended = false;
        updateData.attendedAt = null;
      }
    }

    const [updated] = await db
      .update(reservationSlots)
      .set(updateData)
      .where(eq(reservationSlots.id, slotId))
      .returning();

    return successResponse(updated, 'Asistencia actualizada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
