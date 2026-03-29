import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { 
  classroomReservations, 
  reservationSlots, 
  staff, 
  reservationAttendance 
} from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { normalizeDate } from '@/lib/utils/reservations';
import { eq, and, or, desc } from 'drizzle-orm';

// GET /api/classroom-reservations/my-today - Get current user's reservations for today
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    // Get today's date normalized
    const today = normalizeDate(new Date().toISOString());

    const isSuperAdmin = user.role === 'superadmin' || user.isSuperAdmin;

    // Get user's staff record (if they have one)
    let staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.email, user.email),
        eq(staff.institutionId, institutionId)
      ),
    });

    // If superadmin but no staff record, we don't return [] yet, we continue
    if (!staffRecord && !isSuperAdmin) {
      return successResponse([]);
    }

    // Get reservations:
    // 1. Owned by this staff member (if any)
    // 2. OR Type is workshop (Institutional Workshops)
    // 3. IF SUPERADMIN: All active reservations in the institution
    const searchConditions = [
        eq(classroomReservations.institutionId, institutionId),
        eq(classroomReservations.status, 'active'),
    ];

    if (!isSuperAdmin && staffRecord) {
        searchConditions.push(
            or(
                eq(classroomReservations.staffId, staffRecord.id),
                eq(classroomReservations.type, 'workshop')
            ) as any
        );
    }

    const reservationsList = await db.query.classroomReservations.findMany({
      where: and(...searchConditions),
      with: {
        classroom: true,
        staff: {
          columns: { id: true, name: true, role: true }
        },
        grade: true,
        section: true,
        curricularArea: true,
        attendance: staffRecord ? {
           where: eq(reservationAttendance.staffId, staffRecord.id)
        } : undefined,
        slots: {
          where: eq(reservationSlots.date, today),
          with: {
            pedagogicalHour: true,
          },
        },
      },
      orderBy: [desc(classroomReservations.createdAt)],
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
