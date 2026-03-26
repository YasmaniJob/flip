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
          ilike(staff.phone, searchLower),
          ilike(staff.area, searchLower),
          ilike(staff.role, searchLower)
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

    // Parallel queries for better performance
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

    // Include admins if requested - optimized to only run on first page
    if (include_admins === 'true' && page === 1) {
      const adminConditions: any[] = [
        eq(users.institutionId, institutionId),
        or(eq(users.role, 'admin'), eq(users.isSuperAdmin, true)),
      ];

      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        adminConditions.push(
          or(
            ilike(users.name, searchLower),
            ilike(users.email, searchLower),
            ilike(users.dni, searchLower)
          )
        );
      }

      const admins = await db.query.users.findMany({
        where: and(...adminConditions),
        columns: {
          id: true,
          institutionId: true,
          name: true,
          dni: true,
          email: true,
          role: true,
          isSuperAdmin: true,
          createdAt: true,
        },
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

      // Use Set for O(1) lookups instead of Map
      const staffEmailSet = new Set(
        staffData.map((s) => s.email?.toLowerCase()).filter(Boolean)
      );
      
      // Filter out admins that already exist in staff
      const uniqueAdmins = mappedAdmins.filter(
        (admin) => !admin.email || !staffEmailSet.has(admin.email.toLowerCase())
      );

      mixedData = [...uniqueAdmins, ...staffData];
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
