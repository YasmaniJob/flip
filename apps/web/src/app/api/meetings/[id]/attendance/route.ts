import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetings, meetingAttendance, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createAttendanceSchema } from '@/lib/validations/schemas/meetings';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// GET /api/meetings/:id/attendance - List attendance for meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { id } = await params;

    // Verify meeting exists and belongs to institution
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, id),
        eq(meetings.institutionId, institutionId)
      ),
    });

    if (!meeting) {
      throw new NotFoundError('Reunión no encontrada');
    }

    // Get attendance records
    const attendanceList = await db.query.meetingAttendance.findMany({
      where: eq(meetingAttendance.meetingId, id),
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

// POST /api/meetings/:id/attendance - Add attendance record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { id } = await params;

    const body = await request.json();
    const data = validateBody(createAttendanceSchema, body);

    // Verify meeting exists and belongs to institution
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, id),
        eq(meetings.institutionId, institutionId)
      ),
    });

    if (!meeting) {
      throw new NotFoundError('Reunión no encontrada');
    }

    // Verify staff exists and belongs to institution
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.id, data.staffId),
        eq(staff.institutionId, institutionId)
      ),
    });

    if (!staffRecord) {
      throw new NotFoundError('Personal no encontrado');
    }

    // Check if attendance already exists (unique constraint: meetingId + staffId)
    const existingAttendance = await db.query.meetingAttendance.findFirst({
      where: and(
        eq(meetingAttendance.meetingId, id),
        eq(meetingAttendance.staffId, data.staffId)
      ),
    });

    if (existingAttendance) {
      throw new ValidationError('Este personal ya tiene un registro de asistencia para esta reunión');
    }

    // Create attendance record
    const [attendance] = await db
      .insert(meetingAttendance)
      .values({
        meetingId: id,
        staffId: data.staffId,
        status: data.status || 'presente',
        notes: data.notes,
      })
      .returning();

    // Return with staff relation
    const attendanceWithStaff = await db.query.meetingAttendance.findFirst({
      where: eq(meetingAttendance.id, attendance.id),
      with: {
        staff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(attendanceWithStaff, 'Asistencia registrada exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
