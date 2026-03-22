import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reservationTasks, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateTaskSchema } from '@/lib/validations/schemas/reservations';
import { buildPartialUpdate } from '@/lib/utils/patch';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// PUT /api/classroom-reservations/tasks/:taskId - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { taskId } = await params;

    const body = await request.json();
    const data = validateBody(updateTaskSchema, body);

    // Get task with reservation to verify institution
    const task = await db.query.reservationTasks.findFirst({
      where: eq(reservationTasks.id, taskId),
      with: {
        reservation: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Verify institution
    if (task.reservation.institutionId !== institutionId) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // If assignedStaffId provided, verify staff exists
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
      .update(reservationTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(reservationTasks.id, taskId))
      .returning();

    // Return with assigned staff relation
    const taskWithStaff = await db.query.reservationTasks.findFirst({
      where: eq(reservationTasks.id, updated.id),
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

// DELETE /api/classroom-reservations/tasks/:taskId - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { taskId } = await params;

    // Get task with reservation to verify institution
    const task = await db.query.reservationTasks.findFirst({
      where: eq(reservationTasks.id, taskId),
      with: {
        reservation: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Verify institution
    if (task.reservation.institutionId !== institutionId) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Delete task
    await db
      .delete(reservationTasks)
      .where(eq(reservationTasks.id, taskId));

    return successResponse(null, 'Tarea eliminada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
