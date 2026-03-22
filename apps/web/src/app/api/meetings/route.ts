import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createMeetingSchema } from '@/lib/validations/schemas/meetings';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/utils/response';
import { eq, desc } from 'drizzle-orm';

// GET /api/meetings - List all meetings
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get meetings with relations
    const meetingsList = await db.query.meetings.findMany({
      where: eq(meetings.institutionId, institutionId),
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

    // Count total
    const totalResult = await db
      .select({ count: meetings.id })
      .from(meetings)
      .where(eq(meetings.institutionId, institutionId));

    const total = totalResult.length;

    return paginatedResponse(meetingsList, {
      page,
      limit,
      total,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/meetings - Create meeting
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);

    const body = await request.json();
    const data = validateBody(createMeetingSchema, body);

    // Create meeting
    const [meeting] = await db
      .insert(meetings)
      .values({
        institutionId,
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

    return successResponse(meeting, 'Reunión creada exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
