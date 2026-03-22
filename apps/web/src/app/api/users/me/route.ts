import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateNameSchema } from '@/lib/validations/schemas/users';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/users/me - Update current user name
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const body = await request.json();
    const data = validateBody(updateNameSchema, body);

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Update name
    await db
      .update(users)
      .set({ name: data.name })
      .where(eq(users.id, user.id));

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
