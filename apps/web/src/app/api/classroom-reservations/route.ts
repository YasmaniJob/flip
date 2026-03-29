import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { 
  classroomReservations, 
  reservationSlots, 
  staff, 
  classrooms,
  users
} from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createReservationSchema, reservationsQuerySchema } from '@/lib/validations/schemas/reservations';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { validateSlotsNoConflicts, normalizeDate } from '@/lib/utils/reservations';
import { eq, desc, and, or, asc, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/classroom-reservations - List reservations with filters
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = validateQuery(reservationsQuerySchema, searchParams);

    const limit = Math.min(parseInt(query.limit || '50'), 200);
    const page = parseInt(query.page || '1');
    const offset = (page - 1) * limit;

    // Build where conditions for reservations
    const conditions = [
        eq(classroomReservations.institutionId, institutionId),
        eq(classroomReservations.status, 'active')
    ];

    if (query.classroomId) {
      conditions.push(eq(classroomReservations.classroomId, query.classroomId));
    }

    // Build where conditions for slots based on date filters
    const slotsWhereConditions = [];
    if (query.startDate) {
      slotsWhereConditions.push(gte(reservationSlots.date, new Date(normalizeDate(query.startDate))));
    }
    if (query.endDate) {
      slotsWhereConditions.push(lte(reservationSlots.date, new Date(normalizeDate(query.endDate))));
    }

    const reservationsWithRelations = await db.query.classroomReservations.findMany({
      where: and(...conditions),
      with: {
        classroom: {
          columns: { id: true, name: true }
        },
        staff: {
          columns: { id: true, name: true, role: true }
        },
        grade: {
          columns: { id: true, name: true }
        },
        section: {
          columns: { id: true, name: true }
        },
        curricularArea: {
          columns: { id: true, name: true }
        },
        slots: {
          where: slotsWhereConditions.length > 0 ? and(...slotsWhereConditions) : undefined,
          with: {
            pedagogicalHour: {
              columns: { id: true, name: true, startTime: true, endTime: true, isBreak: true, sortOrder: true }
            },
          },
          orderBy: [asc(reservationSlots.date)],
        },
      },
      orderBy: [desc(classroomReservations.createdAt)],
      limit,
      offset,
    });

    // Filter by shift if provided (calculate shift based on startTime)
    let filteredReservations = reservationsWithRelations;
    if (query.shift) {
      filteredReservations = reservationsWithRelations
        .map((reservation) => ({
          ...reservation,
          slots: reservation.slots.filter((slot) => {
            if (!slot.pedagogicalHour) return false;
            const isMorning = slot.pedagogicalHour.startTime < '13:00';
            const shiftName = isMorning ? 'mañana' : 'tarde';
            return shiftName === query.shift;
          }),
        }))
        .filter((reservation) => reservation.slots.length > 0);
    }

    // Filter out reservations with no slots (after date/shift filtering)
    filteredReservations = filteredReservations.filter((reservation) => reservation.slots.length > 0);

    // For now, if shit filtering was used, total might be different than requested
    // but we can't easily count shift-filtered results in Drizzle without complex joins.
    // However, for standard pagination, we should include the total count from DB.
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(classroomReservations).where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    console.log(`[TIMING] classroom-reservations GET: ${Date.now() - start}ms`);
    return paginatedResponse(filteredReservations, {
      page,
      limit,
      total,
      lastPage: totalPages
    });
  } catch (error) {
    console.error('[ERROR] classroom-reservations GET:', error);
    return errorResponse(error);
  }
}

// POST /api/classroom-reservations - Create reservation with slots
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const body = await request.json();
    const data = validateBody(createReservationSchema, body);

    // Verify staff exists and belongs to institution
    let staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.id, data.staffId),
        eq(staff.institutionId, institutionId)
      ),
    });

    // If not found, check if this is a userId belonging to an Admin/SuperAdmin
    if (!staffRecord) {
        const potentialAdmin = await db.query.users.findFirst({
            where: and(
                eq(users.id, data.staffId),
                or(eq(users.role, 'admin'), eq(users.role, 'pip'), eq(users.isSuperAdmin, true)) as any
            ),
        });

        if (potentialAdmin) {
            // Auto-create staff record for this admin/PIP in this institution
            const [newStaff] = await db.insert(staff).values({
                id: randomUUID(),
                institutionId,
                name: potentialAdmin.name,
                email: potentialAdmin.email,
                role: (potentialAdmin as any).isSuperAdmin ? 'superadmin' : (potentialAdmin.role === 'pip' ? 'pip' : 'admin'),
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
            
            staffRecord = newStaff;
            data.staffId = newStaff.id;
        }
    }

    if (!staffRecord) {
      throw new NotFoundError('Responsable no encontrado');
    }

    if (!data.classroomId) {
        throw new ValidationError('El aula es obligatoria');
    }

    // Verify classroom exists
    const classroom = await db.query.classrooms.findFirst({
      where: and(
        eq(classrooms.id, data.classroomId),
        eq(classrooms.institutionId, institutionId)
      ),
    });

    if (!classroom) {
      throw new NotFoundError('Aula no encontrada');
    }

    // Validate no conflicts for all slots
    const slotsToValidate = data.slots.map((slot) => ({
      classroomId: data.classroomId!,
      date: normalizeDate(slot.date),
      pedagogicalHourId: slot.pedagogicalHourId,
    }));

    await validateSlotsNoConflicts(slotsToValidate);

    // Create reservation + slots in transaction
    const result = await db.transaction(async (tx) => {
      // Insert reservation
      const [reservation] = await tx
        .insert(classroomReservations)
        .values({
          id: randomUUID(),
          institutionId,
          staffId: data.staffId,
          classroomId: data.classroomId!,
          gradeId: data.gradeId || null,
          sectionId: data.sectionId || null,
          curricularAreaId: data.curricularAreaId || null,
          type: data.type || 'class',
          title: data.title || null,
          purpose: data.purpose || null,
          status: 'active',
        })
        .returning();

      // Insert slots
      const slotsData = data.slots.map((slot) => ({
        id: randomUUID(),
        reservationId: reservation.id,
        institutionId,
        classroomId: data.classroomId!,
        pedagogicalHourId: slot.pedagogicalHourId,
        date: new Date(normalizeDate(slot.date)),
        attended: false,
      }));

      const createdSlots = await tx
        .insert(reservationSlots)
        .values(slotsData)
        .returning();

      return { reservation, slots: createdSlots };
    });

    // Return with relations
    const reservationWithRelations = await db.query.classroomReservations.findFirst({
      where: eq(classroomReservations.id, result.reservation.id),
      with: {
        classroom: true,
        staff: true,
        grade: true,
        section: true,
        curricularArea: true,
        slots: {
          with: {
            pedagogicalHour: true,
          },
        },
      },
    });

    return successResponse(reservationWithRelations, 'Reserva creada exitosamente', 201);
  } catch (error) {
    console.error('[ERROR] classroom-reservations POST:', error);
    return errorResponse(error);
  }
}
