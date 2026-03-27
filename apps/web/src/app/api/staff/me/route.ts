import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@/lib/utils/errors';

// GET /api/staff/me - Get the staff record for the current user in this institution
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    // Find staff record by email and institution
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.institutionId, institutionId),
        eq(staff.email, user.email)
      ),
    });

    if (!staffRecord) {
      throw new NotFoundError('No se encontró su registro de personal en esta institución');
    }

    return successResponse(staffRecord);
  } catch (error) {
    return errorResponse(error);
  }
}
