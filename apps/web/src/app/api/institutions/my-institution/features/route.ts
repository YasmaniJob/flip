import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

// POST /api/institutions/my-institution/features - Update institution feature flags
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    if (!user.institutionId) {
      throw new UnauthorizedError('No tienes una institución asignada');
    }

    // Only admins/superadmins can change feature flags
    if (user.role !== 'admin' && !user.isSuperAdmin) {
      throw new UnauthorizedError('No tienes permisos para realizar esta acción');
    }

    const { features } = await request.json();

    if (!features) {
      throw new Error('Faltan datos de configuración');
    }

    // Get current institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, user.institutionId),
    });

    if (!institution) {
      throw new NotFoundError('Institución no encontrada');
    }

    // Update settings.features while preserving other settings
    const currentSettings = (institution.settings as any) || {};
    const newSettings = {
      ...currentSettings,
      features: features
    };

    // Update institution
    await db
      .update(institutions)
      .set({ settings: newSettings })
      .where(eq(institutions.id, user.institutionId));

    revalidateTag('config-loadout');

    return successResponse({ success: true, features: newSettings.features });
  } catch (error) {
    return errorResponse(error);
  }
}
