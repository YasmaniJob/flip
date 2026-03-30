import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetings, meetingTasks } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createMeetingSchema } from '@/lib/validations/schemas/meetings';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/utils/response';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/meetings - List meetings (only the authenticated user's own meetings)
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filter by BOTH institutionId AND createdByUserId for strict privacy
    const meetingsList = await db.query.meetings.findMany({
      where: and(
        eq(meetings.institutionId, institutionId),
        eq(meetings.createdByUserId, user.id)
      ),
      orderBy: [desc(meetings.date), desc(meetings.createdAt)],
      limit,
      offset,
      with: {
        attendance: {
          with: {
            staff: true,
          },
        },
        tasks: {
          with: {
            assignedStaff: true,
          },
        },
      },
    });

    // Count total (only this user's meetings)
    const totalResult = await db
      .select({ count: meetings.id })
      .from(meetings)
      .where(
        and(
          eq(meetings.institutionId, institutionId),
          eq(meetings.createdByUserId, user.id)
        )
      );

    const total = totalResult.length;
    const lastPage = Math.max(1, Math.ceil(total / limit));

    return paginatedResponse(meetingsList, {
      page,
      limit,
      total,
      lastPage,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/meetings - Create meeting (saves createdByUserId)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const body = await request.json();
    const data = validateBody(createMeetingSchema, body);

    // Create meeting linked to the authenticated user
    const [meeting] = await db
      .insert(meetings)
      .values({
        institutionId,
        createdByUserId: user.id,  // record the owner
        title: data.title,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || 'asistencia_tecnica',
        status: data.status || 'active',
        involvedActors: data.involvedActors || [],
        involvedAreas: data.involvedAreas || [],
        notes: data.notes,
      })
      .returning();

    // Create tasks if provided
    if (body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0) {
      await db.insert(meetingTasks).values(
        body.tasks.map((task: any) => ({
          meetingId: meeting.id,
          description: task.description,
          assignedStaffId: task.assignedStaffId,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          status: task.status || 'pending',
        }))
      );
    }

    return successResponse(meeting, 'Reunión creada exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
