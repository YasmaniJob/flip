import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { taskId } = params;
        const body = await request.json();

        const [updatedTask] = await db
            .update(meetingTasks)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(meetingTasks.id, taskId))
            .returning();

        if (!updatedTask) {
            return NextResponse.json({ error: 'Acuerdo no encontrado' }, { status: 404 });
        }

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error('Error updating meeting task:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el acuerdo' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { taskId } = params;

        await db.delete(meetingTasks).where(eq(meetingTasks.id, taskId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting meeting task:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el acuerdo' },
            { status: 500 }
        );
    }
}
