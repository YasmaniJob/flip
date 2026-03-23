import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationSlots, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { normalizeDate } from '@/lib/utils/reservations';
import { eq, and } from 'drizzle-orm';

// GET /api/classroom-reservations/my-today - Get current user's reservations for today
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    // Get today's date normalized
    const today = normalizeDate(new Date().toISOString());

    // Get user's staff record
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.email, user.email),
        eq(staff.institutionId, institutionId)
      ),
    });

    if (!staffRecord) {
      return successResponse([]);
    }

    // Get reservations for this staff member
    const reservationsList = await db.query.classroomReservations.findMany({
      where: and(
        eq(classroomReservations.staffId, staffRecord.id),
        eq(classroomReservations.institutionId, institutionId),
        eq(classroomReservations.status, 'active')
      ),
      with: {
        classroom: true,
        staff: true,
        grade: true,
        section: true,
        curricularArea: true,
        slots: {
          where: eq(reservationSlots.date, today),
          with: {
            pedagogicalHour: true,
          },
        },
      },
    });

    // Filter out reservations with no slots for today
    const todayReservations = reservationsList.filter(
      (reservation) => reservation.slots.length > 0
    );

    return successResponse(todayReservations);
  } catch (error) {
    return errorResponse(error);
  }
}
