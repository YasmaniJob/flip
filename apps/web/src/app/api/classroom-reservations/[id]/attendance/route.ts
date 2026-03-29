import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationAttendance, staff, users } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createAttendanceSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
        staff: true,
      },
    });

    // Flatten for easier frontend consumption
    const flattenedList = attendanceList.map(item => ({
      ...item,
      staffName: item.staff?.name || 'Sin nombre',
      staffRole: item.staff?.role || 'DOCENTE',
    }));

    return successResponse(flattenedList);
  } catch (error) {
    console.error('[ERROR] /api/classroom-reservations/[id]/attendance GET:', error);
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

    // Normalize IDs to an array
    const staffIds = data.staffIds || (data.staffId ? [data.staffId] : []);
    
    if (staffIds.length === 0) {
        throw new NotFoundError('No se proporcionaron IDs de personal');
    }

    const processedStaffIds: string[] = [];

    // Process each ID (check existence and handle auto-registration)
    for (const sId of staffIds) {
        // Verify staff exists
        let staffRecord = await db.query.staff.findFirst({
            where: and(
                eq(staff.id, sId),
                eq(staff.institutionId, institutionId)
            ),
        });

        // If not found, check if this is a userId belonging to an Admin/SuperAdmin/PIP
        if (!staffRecord) {
            const potentialAdmin = await db.query.users.findFirst({
                where: and(
                    eq(users.id, sId),
                    or(
                        eq(users.role, 'admin'), 
                        eq(users.role, 'pip'),
                        eq(users.isSuperAdmin, true)
                    ) as any
                ),
            });

            if (potentialAdmin) {
                // Auto-create staff record for this admin
                // Check if they already exist in staff by email to avoid unique constraint error
                const existingByEmail = potentialAdmin.email ? await db.query.staff.findFirst({
                    where: and(
                        eq(staff.institutionId, institutionId),
                        eq(staff.email, potentialAdmin.email)
                    )
                }) : null;

                if (existingByEmail) {
                    staffRecord = existingByEmail;
                } else {
                    const [newStaff] = await db.insert(staff).values({
                        id: randomUUID(),
                        institutionId,
                        name: potentialAdmin.name,
                        email: potentialAdmin.email,
                        role: potentialAdmin.isSuperAdmin ? 'superadmin' : potentialAdmin.role || 'admin',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }).returning();
                    staffRecord = newStaff;
                }
            }
        }

        if (staffRecord) {
            processedStaffIds.push(staffRecord.id);
        }
    }

    if (processedStaffIds.length === 0) {
        throw new NotFoundError('No se encontró personal válido para registrar');
    }

    // Bulk insert with ON CONFLICT DO NOTHING
    const valuesToInsert = processedStaffIds.map(sId => ({
        id: randomUUID(),
        reservationId: id,
        staffId: sId,
        status: 'presente' as any,
    }));

    await db
        .insert(reservationAttendance)
        .values(valuesToInsert)
        .onConflictDoNothing({
            target: [reservationAttendance.reservationId, reservationAttendance.staffId]
        });

    return successResponse({ count: processedStaffIds.length }, 'Asistencia registrada exitosamente', 201);
  } catch (error) {
    console.error('[ERROR] /api/classroom-reservations/[id]/attendance POST:', error);
    return errorResponse(error);
  }
}
