import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetingTasks, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateTaskSchema } from '@/lib/validations/schemas/meetings';
import { buildPartialUpdate } from '@/lib/utils/patch';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// PATCH /api/meetings/tasks/:taskId - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { taskId } = await params;

    const body = await request.json();
    const data = validateBody(updateTaskSchema, body);

    // Get task with meeting to verify institution
    const task = await db.query.meetingTasks.findFirst({
      where: eq(meetingTasks.id, taskId),
      with: {
        meeting: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Verify meeting belongs to institution
    if (task.meeting.institutionId !== institutionId) {
      throw new NotFoundError('Tarea no encontrada');
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

    // Build partial update
    const updates = buildPartialUpdate({
      description: data.description,
      assignedStaffId: data.assignedStaffId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: data.status,
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No hay campos para actualizar');
    }

    // Update task
    const [updated] = await db
      .update(meetingTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(meetingTasks.id, taskId))
      .returning();

    // Return with assigned staff relation if exists
    const taskWithStaff = await db.query.meetingTasks.findFirst({
      where: eq(meetingTasks.id, updated.id),
      with: {
        assignedStaff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(taskWithStaff, 'Tarea actualizada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/meetings/tasks/:taskId - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { taskId } = await params;

    // Get task with meeting to verify institution
    const task = await db.query.meetingTasks.findFirst({
      where: eq(meetingTasks.id, taskId),
      with: {
        meeting: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Verify meeting belongs to institution
    if (task.meeting.institutionId !== institutionId) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Delete task
    await db
      .delete(meetingTasks)
      .where(eq(meetingTasks.id, taskId));

    return successResponse(null, 'Tarea eliminada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
