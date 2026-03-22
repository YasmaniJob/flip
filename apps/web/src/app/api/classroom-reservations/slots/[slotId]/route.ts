import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationSlots } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { requireModifyPermission } from '@/lib/utils/reservations';
import { eq } from 'drizzle-orm';

// DELETE /api/classroom-reservations/slots/:slotId - Delete individual slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { slotId } = await params;

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

    // Delete slot
    await db
      .delete(reservationSlots)
      .where(eq(reservationSlots.id, slotId));

    return successResponse(null, 'Slot eliminado exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
