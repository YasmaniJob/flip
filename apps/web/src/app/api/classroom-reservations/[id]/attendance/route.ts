import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationAttendance, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createAttendanceSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// GET /api/classroom-reservations/:id/attendance - List attendance for reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { id } = await params;

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

    // Get attendance records
    const attendanceList = await db.query.reservationAttendance.findMany({
      where: eq(reservationAttendance.reservationId, id),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(attendanceList);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/classroom-reservations/:id/attendance - Add attendee to reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { id } = await params;

    const body = await request.json();
    const data = validateBody(createAttendanceSchema, body);

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

    // Verify staff exists
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.id, data.staffId),
        eq(staff.institutionId, institutionId)
      ),
    });

    if (!staffRecord) {
      throw new NotFoundError('Personal no encontrado');
    }

    // Create attendance record
    const [attendance] = await db
      .insert(reservationAttendance)
      .values({
        reservationId: id,
        staffId: data.staffId,
        status: 'presente',
      })
      .returning();

    // Return with staff relation
    const attendanceWithStaff = await db.query.reservationAttendance.findFirst({
      where: eq(reservationAttendance.id, attendance.id),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(attendanceWithStaff, 'Asistente agregado exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
