import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationAttendance } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';

// DELETE /api/classroom-reservations/attendance/:attendanceId - Delete attendee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { attendanceId } = await params;

    // Get attendance with reservation to verify institution
    const attendance = await db.query.reservationAttendance.findFirst({
      where: eq(reservationAttendance.id, attendanceId),
      with: {
        reservation: true,
      },
    });

    if (!attendance) {
      throw new NotFoundError('Asistencia no encontrada');
    }

    // Verify institution
    if (attendance.reservation.institutionId !== institutionId) {
      throw new NotFoundError('Asistencia no encontrada');
    }

    // Delete attendance
    await db
      .delete(reservationAttendance)
      .where(eq(reservationAttendance.id, attendanceId));

    return successResponse(null, 'Asistente eliminado exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
