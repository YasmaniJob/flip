import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { eq } from 'drizzle-orm';

// GET /api/institutions/public/branding - Get public branding info (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    const institutionId = request.nextUrl.searchParams.get('id');

    if (!institutionId) {
      return successResponse({
        brandColor: null,
        name: null,
        logoUrl: null,
      });
    }

    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
    });

    if (!institution) {
      return successResponse({
        brandColor: null,
        name: null,
        logoUrl: null,
      });
    }

    const settings = (institution.settings as any) || {};

    return successResponse({
      brandColor: settings.brandColor || null,
      name: institution.name || null,
      logoUrl: settings.logoUrl || null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
