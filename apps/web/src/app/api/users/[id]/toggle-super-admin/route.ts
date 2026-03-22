import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { toggleSuperAdminSchema } from '@/lib/validations/schemas/users';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/users/:id/toggle-super-admin - Toggle SuperAdmin status (SuperAdmin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin(request);

    const body = await request.json();
    const data = validateBody(toggleSuperAdminSchema, body);

    const { id: userId } = params;

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Update SuperAdmin status
    await db
      .update(users)
      .set({ isSuperAdmin: data.enabled })
      .where(eq(users.id, userId));

    return successResponse({
      success: true,
      message: `SuperAdmin status ${data.enabled ? 'habilitado' : 'deshabilitado'} para el usuario`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
