import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetingAttendance } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateAttendanceSchema } from '@/lib/validations/schemas/meetings';
import { buildPartialUpdate } from '@/lib/utils/patch';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';

// PATCH /api/meetings/attendance/:attendanceId - Update attendance
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { attendanceId } = await params;

    const body = await request.json();
    const data = validateBody(updateAttendanceSchema, body);

    // Get attendance with meeting to verify institution
    const attendance = await db.query.meetingAttendance.findFirst({
      where: eq(meetingAttendance.id, attendanceId),
      with: {
        meeting: true,
      },
    });

    if (!attendance) {
      throw new NotFoundError('Registro de asistencia no encontrado');
    }

    // Verify meeting belongs to institution
    if (attendance.meeting.institutionId !== institutionId) {
      throw new NotFoundError('Registro de asistencia no encontrado');
    }

    // Build partial update
    const updates = buildPartialUpdate(data);

    if (Object.keys(updates).length === 0) {
      throw new NotFoundError('No hay campos para actualizar');
    }

    // Update attendance
    const [updated] = await db
      .update(meetingAttendance)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(meetingAttendance.id, attendanceId))
      .returning();

    // Return with staff relation
    const attendanceWithStaff = await db.query.meetingAttendance.findFirst({
      where: eq(meetingAttendance.id, updated.id),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(attendanceWithStaff, 'Asistencia actualizada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/meetings/attendance/:attendanceId - Delete attendance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { attendanceId } = await params;

    // Get attendance with meeting to verify institution
    const attendance = await db.query.meetingAttendance.findFirst({
      where: eq(meetingAttendance.id, attendanceId),
      with: {
        meeting: true,
      },
    });

    if (!attendance) {
      throw new NotFoundError('Registro de asistencia no encontrado');
    }

    // Verify meeting belongs to institution
    if (attendance.meeting.institutionId !== institutionId) {
      throw new NotFoundError('Registro de asistencia no encontrado');
    }

    // Delete attendance
    await db
      .delete(meetingAttendance)
      .where(eq(meetingAttendance.id, attendanceId));

    return successResponse(null, 'Asistencia eliminada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
