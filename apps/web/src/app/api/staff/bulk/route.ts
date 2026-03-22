import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { bulkCreateStaffSchema } from '@/lib/validations/schemas/staff';
import { ForbiddenError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

// POST /api/staff/bulk - Bulk create staff members
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(bulkCreateStaffSchema, body);

    // Check if any restricted roles
    const hasRestrictedRole = data.staff.some(
      (s) => s.role === 'superadmin' || s.role === 'admin'
    );

    if (hasRestrictedRole && !user.isSuperAdmin) {
      throw new ForbiddenError('Solo el SuperAdmin puede crear usuarios Admin o SuperAdmin');
    }

    if (data.staff.length === 0) {
      return successResponse([]);
    }

    // Map to insert values
    const values = data.staff.map((input) => ({
      id: randomUUID(),
      institutionId,
      name: input.name,
      dni: input.dni || null,
      email: input.email || null,
      phone: input.phone || null,
      area: input.area || null,
      role: input.role,
      status: 'active',
    }));

    const created = await db.insert(staff).values(values).returning();

    return successResponse(created, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
