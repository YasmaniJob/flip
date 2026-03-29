import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationAttendance, staff, classroomReservations } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// POST /api/classroom-reservations/:id/attendance/check-in
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);
    const { id: reservationId } = await params;

    // 1. Verify reservation exists
    const reservation = await db.query.classroomReservations.findFirst({
      where: and(
        eq(classroomReservations.id, reservationId),
        eq(classroomReservations.institutionId, institutionId)
      ),
    });

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada');
    }

    const isSuperAdmin = user.role === 'superadmin' || user.isSuperAdmin;

    // 2. Find the staff record for this user via email
    let staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.email, user.email),
        eq(staff.institutionId, institutionId)
      ),
    });

    // If superadmin and no staff record, create one on the fly
    if (!staffRecord && isSuperAdmin) {
        const [newStaff] = await db.insert(staff).values({
            id: randomUUID(),
            institutionId,
            name: user.name,
            email: user.email,
            role: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        staffRecord = newStaff;
    }

    if (!staffRecord) {
      throw new NotFoundError('No se encontró tu registro de personal en esta institución');
    }

    // 3. Check if already checked-in
    const existing = await db.query.reservationAttendance.findFirst({
      where: and(
        eq(reservationAttendance.reservationId, reservationId),
        eq(reservationAttendance.staffId, staffRecord.id)
      ),
    });

    if (existing) {
      return successResponse(existing, 'Ya estabas registrado en este taller');
    }

    // 4. Create attendance record
    const [newRecord] = await db
      .insert(reservationAttendance)
      .values({
        id: randomUUID(),
        reservationId,
        staffId: staffRecord.id,
        status: 'presente',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return successResponse(newRecord, 'Te has registrado exitosamente en el taller', 201);
  } catch (error) {
    console.error('[Attendance Check-in Error]:', error);
    return errorResponse(error);
  }
}
