import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateSettingsSchema } from '@/lib/validations/schemas/users';
import { NotFoundError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users/me/settings - Get current user settings
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userData) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return successResponse(userData.settings || {});
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/users/me/settings - Update current user settings (merge)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const body = await request.json();
    const newSettings = validateBody(updateSettingsSchema, body);

    // Get current user
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userData) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Merge existing settings with new settings
    const currentSettings = (userData.settings as Record<string, any>) || {};
    const mergedSettings = { ...currentSettings, ...newSettings };

    // Update settings
    await db
      .update(users)
      .set({ settings: mergedSettings })
      .where(eq(users.id, user.id));

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
