import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetingTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateTaskSchema } from '@/lib/validations/schemas/meetings';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';

// PATCH /api/meetings/tasks/:taskId - Update task (acuerdo)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { user } = await requireAuth(request);
        const institutionId = await getInstitutionId(user);
        const { taskId } = params;

        // C1 FIX: Verify task exists AND belongs to the user's institution before updating
        const task = await db.query.meetingTasks.findFirst({
            where: eq(meetingTasks.id, taskId),
            with: { meeting: true },
        });

        if (!task || task.meeting.institutionId !== institutionId) {
            throw new NotFoundError('Acuerdo no encontrado');
        }

        const body = await request.json();
        const data = validateBody(updateTaskSchema, body);

        const [updatedTask] = await db
            .update(meetingTasks)
            .set({
                description: data.description,
                status: data.status,
                assignedStaffId: data.assignedStaffId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                updatedAt: new Date(),
            })
            .where(eq(meetingTasks.id, taskId))
            .returning();

        return successResponse(updatedTask);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/meetings/tasks/:taskId - Delete task (acuerdo)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { user } = await requireAuth(request);
        const institutionId = await getInstitutionId(user);
        const { taskId } = params;

        // C1 FIX: Verify task exists AND belongs to the user's institution before deleting
        const task = await db.query.meetingTasks.findFirst({
            where: eq(meetingTasks.id, taskId),
            with: { meeting: true },
        });

        if (!task || task.meeting.institutionId !== institutionId) {
            throw new NotFoundError('Acuerdo no encontrado');
        }

        await db.delete(meetingTasks).where(eq(meetingTasks.id, taskId));

        return successResponse({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
