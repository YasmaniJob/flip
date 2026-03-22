import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { updateBrandSchema } from '@/lib/validations/schemas/institutions';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';
import { eq } from 'drizzle-orm';

// POST /api/institutions/my-institution/brand - Update institution branding
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    if (!user.institutionId) {
      throw new UnauthorizedError('No tienes una institución asignada');
    }

    const body = await request.json();
    const data = validateBody(updateBrandSchema, body);

    // Get current institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, user.institutionId),
    });

    if (!institution) {
      throw new NotFoundError('Institución no encontrada');
    }

    // Preserve existing settings and update branding
    const currentSettings = (institution.settings as any) || {};
    const newSettings = {
      ...currentSettings,
      ...(data.brandColor !== undefined && { brandColor: data.brandColor || null }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
    };

    // Update institution settings
    await db
      .update(institutions)
      .set({ settings: newSettings })
      .where(eq(institutions.id, user.institutionId));

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
