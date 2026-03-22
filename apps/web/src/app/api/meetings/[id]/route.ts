import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { eq, and } from 'drizzle-orm';

// GET /api/meetings/:id - Get meeting by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);
    const { id } = await params;

    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, id),
        eq(meetings.institutionId, institutionId)
      ),
      with: {
        attendance: {
          with: {
            staff: {
              with: {
                user: true,
              },
            },
          },
        },
        tasks: {
          with: {
            assignedStaff: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundError('Reunión no encontrada');
    }

    return successResponse(meeting);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/meetings/:id - Delete meeting
export async function DELETE(
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

    // Delete meeting (cascade will handle attendance and tasks)
    await db
      .delete(meetings)
      .where(
        and(
          eq(meetings.id, id),
          eq(meetings.institutionId, institutionId)
        )
      );

    return successResponse(null, 'Reunión eliminada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
