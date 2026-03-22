import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetings, meetingTasks, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createTaskSchema } from '@/lib/validations/schemas/meetings';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// POST /api/meetings/:id/tasks - Create task (acuerdo)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { id } = await params;

    const body = await request.json();
    const data = validateBody(createTaskSchema, body);

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

    // If assignedStaffId provided, verify staff exists and belongs to institution
    if (data.assignedStaffId) {
      const staffRecord = await db.query.staff.findFirst({
        where: and(
          eq(staff.id, data.assignedStaffId),
          eq(staff.institutionId, institutionId)
        ),
      });

      if (!staffRecord) {
        throw new NotFoundError('Personal asignado no encontrado');
      }
    }

    // Create task
    const [task] = await db
      .insert(meetingTasks)
      .values({
        meetingId: id,
        description: data.description,
        assignedStaffId: data.assignedStaffId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'pending',
      })
      .returning();

    // Return with assigned staff relation if exists
    const taskWithStaff = await db.query.meetingTasks.findFirst({
      where: eq(meetingTasks.id, task.id),
      with: {
        assignedStaff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(taskWithStaff, 'Tarea creada exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
