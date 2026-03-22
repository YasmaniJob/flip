import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { changePasswordSchema } from '@/lib/validations/schemas/users';
import { ValidationError } from '@/lib/utils/errors';
import { auth } from '@/lib/auth';

// POST /api/users/me/password - Change current user password
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const data = validateBody(changePasswordSchema, body);

    // Use Better Auth to change password
    try {
      await auth.api.changePassword({
        headers: request.headers,
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      });

      return successResponse({ success: true });
    } catch (error: any) {
      throw new ValidationError(error.message || 'Error al cambiar contraseña');
    }
  } catch (error) {
    return errorResponse(error);
  }
}
