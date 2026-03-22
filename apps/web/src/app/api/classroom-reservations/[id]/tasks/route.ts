import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { classroomReservations, reservationTasks, staff } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createTaskSchema } from '@/lib/validations/schemas/reservations';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// GET /api/classroom-reservations/:id/tasks - List tasks for reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
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

    // Get tasks
    const tasksList = await db.query.reservationTasks.findMany({
      where: eq(reservationTasks.reservationId, id),
      with: {
        assignedStaff: {
          with: {
            user: true,
          },
        },
      },
    });

    return successResponse(tasksList);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/classroom-reservations/:id/tasks - Create task
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

    // Create task
    const [task] = await db
      .insert(reservationTasks)
      .values({
        reservationId: id,
        description: data.description,
        assignedStaffId: data.assignedStaffId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'pending',
      })
      .returning();

    // Return with assigned staff relation
    const taskWithStaff = await db.query.reservationTasks.findFirst({
      where: eq(reservationTasks.id, task.id),
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
