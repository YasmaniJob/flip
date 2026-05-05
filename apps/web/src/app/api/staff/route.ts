import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createStaffSchema, staffQuerySchema } from '@/lib/validations/schemas/staff';
import { ValidationError, ForbiddenError, TooManyRequestsError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { staff, users, reservationAttendance } from '@/lib/db/schema';
import { eq, and, ilike, or, count, notInArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { unstable_cache, revalidateTag } from 'next/cache';

// Optimize: Parallelize all queries and include dynamic cache key
async function fetchStaffData(institutionId: string, query: any) {
  const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      status, 
      include_admins, 
      exclude_reservation_id 
  } = query;
  const offset = ((page || 1) - 1) * (limit || 10);

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

  // 1. Prepare exclusion lists if needed
  let excludedStaffIds: string[] = [];
  let excludedEmails: string[] = [];
  let excludedDnis: string[] = [];

  if (exclude_reservation_id) {
      const attendees = await db.query.reservationAttendance.findMany({
          where: eq(reservationAttendance.reservationId, exclude_reservation_id),
          with: { staff: true }
      });
      
      attendees.forEach(a => {
          if (a.staffId) excludedStaffIds.push(a.staffId);
          if (a.staff?.email) excludedEmails.push(a.staff.email.toLowerCase());
          if (a.staff?.dni) excludedDnis.push(a.staff.dni);
      });
      
      if (excludedStaffIds.length > 0) {
          // Note: we'll apply this to the query below
      }
  }

  const finalWhereClause = exclude_reservation_id && excludedStaffIds.length > 0
    ? and(whereClause, notInArray(staff.id, excludedStaffIds))
    : whereClause;

  // 2. Build Admin conditions
  const includeAdmins = include_admins === 'true' && page === 1;
  let adminConditions: any[] = [];
  if (includeAdmins) {
    adminConditions = [
      eq(users.institutionId, institutionId),
      or(
        eq(users.role, 'admin'), 
        eq(users.role, 'superadmin'), 
        eq(users.role, 'pip'),
        eq(users.isSuperAdmin, true)
      ) as any,
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
  }

  // 3. Execute all queries in parallel for maximum performance
  const [staffData, totalStaffResult, admins] = await Promise.all([
    db.query.staff.findMany({
      where: finalWhereClause,
      limit,
      offset,
      columns: {
        id: true,
        institutionId: true,
        name: true,
        dni: true,
        email: true,
        role: true,
        status: true,
        area: true,
        phone: true,
        createdAt: true,
      },
      orderBy: (columns, { desc }) => [desc(columns.createdAt)],
    }),
    db.select({ value: count() }).from(staff).where(finalWhereClause),
    includeAdmins 
      ? db.query.users.findMany({
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
        })
      : Promise.resolve([] as any[]),
  ]);

  let mixedData: any[] = staffData;
  let total = totalStaffResult[0].value;

  if (includeAdmins && admins.length > 0) {
    const mappedAdmins = admins.map((u: any) => ({
      id: u.id,
      institutionId: u.institutionId,
      name: u.name,
      dni: u.dni,
      email: u.email,
      phone: null,
      area: null,
      role: u.isSuperAdmin ? 'SuperAdmin' : (u.role === 'pip' ? 'PIP' : (u.role === 'admin' ? 'Admin' : u.role || 'Admin')),
      status: 'active',
      createdAt: u.createdAt,
    }));

    const staffEmailSet = new Set(staffData.map((s) => s.email?.toLowerCase()).filter(Boolean));
    const staffDniSet = new Set(staffData.map((s) => s.dni).filter(Boolean));
    const excludedEmailSet = new Set(excludedEmails);
    const excludedDniSet = new Set(excludedDnis);
    
    const uniqueAdmins = mappedAdmins.filter((admin: any) => {
      const email = admin.email?.toLowerCase();
      const dni = admin.dni;
      const inStaffList = (email && staffEmailSet.has(email)) || (dni && staffDniSet.has(dni));
      if (inStaffList) return false;
      const inAttendance = (email && excludedEmailSet.has(email)) || (dni && excludedDniSet.has(dni));
      if (inAttendance) return false;
      return true;
    });

    mixedData = [...uniqueAdmins, ...staffData];
    total += uniqueAdmins.length;
  }

  const totalPages = Math.ceil(total / limit);

  return {
    data: mixedData,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// Wrapper to use unstable_cache with dynamic keys
const getCachedStaff = (institutionId: string, query: any) => {
  const cacheKey = [
    'staff-list', 
    institutionId, 
    query.page || 1, 
    query.limit || 10, 
    query.search || '', 
    query.role || '', 
    query.status || '', 
    query.include_admins || '',
    query.exclude_reservation_id || ''
  ].join(':');

  return unstable_cache(
    () => fetchStaffData(institutionId, query),
    [cacheKey],
    { revalidate: 300, tags: ['staff'] }
  )();
};

// GET /api/staff - List staff with optional filters and admin inclusion
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`staff-search-${ip}`, 20, 60 * 1000)) {
       throw new TooManyRequestsError();
    }
    const auth = await requireAuth(request);
    const institutionId = await getInstitutionId(auth);

    const searchParams = new URL(request.url).searchParams;
    const query = validateQuery(staffQuerySchema, searchParams);

    const result = await getCachedStaff(institutionId, query);

    return successResponse(result);
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

    revalidateTag('staff');

    return successResponse(newStaff, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
