import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createStaffSchema, staffQuerySchema } from '@/lib/validations/schemas/staff';
import { ValidationError, ForbiddenError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { staff, users } from '@/lib/db/schema';
import { eq, and, ilike, or, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/staff - List staff with optional filters and admin inclusion
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(staffQuerySchema, searchParams);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, role, status, include_admins } = query;
    const offset = (page - 1) * limit;

    // Build where conditions for staff
    const conditions = [eq(staff.institutionId, institutionId)];

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(staff.name, searchLower),
          ilike(staff.dni, searchLower),
          ilike(staff.email, searchLower),
          ilike(staff.area, searchLower)
        )!
      );
    }

    if (role) {
      conditions.push(eq(staff.role, role));
    }

    if (status) {
      conditions.push(eq(staff.status, status));
    }

    const whereClause = and(...conditions);

    // Get staff data
    const [staffData, totalStaffResult] = await Promise.all([
      db.query.staff.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (staff, { desc }) => [desc(staff.createdAt)],
      }),
      db.select({ value: count() }).from(staff).where(whereClause),
    ]);

    let mixedData: any[] = staffData;
    let total = totalStaffResult[0].value;

    // Include admins if requested
    if (include_admins === 'true') {
      const adminConditions: any[] = [
        eq(users.institutionId, institutionId),
        or(eq(users.role, 'admin'), eq(users.isSuperAdmin, true)),
      ];

      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        adminConditions.push(or(ilike(users.name, searchLower), ilike(users.email, searchLower)));
      }

      const admins = await db.query.users.findMany({
        where: and(...adminConditions),
      });

      // Map users to staff-like structure
      const mappedAdmins = admins.map((u) => ({
        id: u.id,
        institutionId: u.institutionId,
        name: u.name,
        dni: u.dni,
        email: u.email,
        phone: null,
        area: null,
        role: u.isSuperAdmin ? 'SuperAdmin' : 'Admin',
        status: 'active',
        createdAt: u.createdAt,
      }));

      // Prioritize admins over staff if they have the same email
      const staffByEmailMap = new Map(staffData.map((s) => [s.email?.toLowerCase(), s]));
      const staffByIdMap = new Map(staffData.map((s) => [s.id, s]));
      const uniqueAdmins: any[] = [];
      
      mappedAdmins.forEach((admin) => {
        const emailKey = admin.email?.toLowerCase();
        if (emailKey && staffByEmailMap.has(emailKey)) {
          // Update the staff entry with admin role
          const staffEntry = staffByEmailMap.get(emailKey)!;
          staffEntry.role = admin.role;
        } else if (staffByIdMap.has(admin.id)) {
          // Fallback to ID if email doesn't match but ID does
          const staffEntry = staffByIdMap.get(admin.id)!;
          staffEntry.role = admin.role;
        } else {
          uniqueAdmins.push(admin);
        }
      });

      // Avoid showing the same person twice if they are in both uniqueAdmins and staffData
      // (though the logic above should handle it, let's be safe)
      const uniqueAdminEmails = new Set(uniqueAdmins.map(a => a.email?.toLowerCase()));
      const filteredStaffData = staffData.filter(s => !s.email || !uniqueAdminEmails.has(s.email.toLowerCase()));

      if (page === 1) {
        mixedData = [...uniqueAdmins, ...filteredStaffData];
      } else {
        mixedData = filteredStaffData;
      }
      total = totalStaffResult[0].value + uniqueAdmins.length;
    }

    const totalPages = Math.ceil(total / limit);

    return successResponse({
      data: mixedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/staff - Create staff member
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createStaffSchema, body);

    // Only SuperAdmin can create SuperAdmin or Admin roles
    if ((data.role === 'superadmin' || data.role === 'admin') && !user.isSuperAdmin) {
      throw new ForbiddenError('Solo el SuperAdmin puede crear usuarios Admin o SuperAdmin');
    }

    // Check for duplicate email
    if (data.email) {
      const existing = await db.query.staff.findFirst({
        where: and(eq(staff.institutionId, institutionId), eq(staff.email, data.email)),
      });

      if (existing) {
        throw new ValidationError('El email ya está registrado en esta institución');
      }
    }

    // Check for duplicate DNI
    if (data.dni) {
      const existingDni = await db.query.staff.findFirst({
        where: and(eq(staff.institutionId, institutionId), eq(staff.dni, data.dni)),
      });

      if (existingDni) {
        throw new ValidationError('El DNI ya está registrado en esta institución');
      }
    }

    const [newStaff] = await db
      .insert(staff)
      .values({
        id: randomUUID(),
        institutionId,
        name: data.name,
        dni: data.dni || null,
        email: data.email || null,
        phone: data.phone || null,
        area: data.area || null,
        role: data.role,
        status: 'active',
      })
      .returning();

    return successResponse(newStaff, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
