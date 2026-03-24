import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationAttendance } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { bulkUpdateAttendanceSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// PUT /api/classroom-reservations/:id/attendance/bulk - Bulk update attendance status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { id } = await params;

    const body = await request.json();
    const data = validateBody(bulkUpdateAttendanceSchema, body);

    // Verify reservation exists
    const reservation = await db.query.classroomReservations.findFirst({
      where: and(
        eq(classroomReservations.id, id),
        eq(classroomReservations.institutionId, institutionId)
      ),
    });

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada');
    }

    // Update each attendance record
    const updates = await Promise.all(
      data.updates.map(async (update) => {
        // Verify attendance belongs to this reservation
        const attendance = await db.query.reservationAttendance.findFirst({
          where: and(
            eq(reservationAttendance.id, update.attendanceId),
            eq(reservationAttendance.reservationId, id)
          ),
        });

        if (!attendance) {
          throw new NotFoundError(`Asistencia ${update.attendanceId} no encontrada`);
        }

        // Update status
        const [updated] = await db
          .update(reservationAttendance)
          .set({
            status: update.status,
            updatedAt: new Date(),
          })
          .where(eq(reservationAttendance.id, update.attendanceId))
          .returning();

        return updated;
      })
    );

    return successResponse(updates, 'Asistencias actualizadas exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
